import type { Request, Response } from 'express';
import type { GenerateContentResult } from '@google/generative-ai';
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError, GoogleGenerativeAIAbortError } from '@google/generative-ai';
import { ResultadoAnalisisSchema, type AnalizarHistorialDTO } from './dtos/analisisClinico.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';
import { obtenerMensajeError } from '../../utils/erroresMongo';

const MAX_INTENTOS = 3;
const ESPERA_BASE_MS = 1500;
// Sin esto, un pedido colgado del lado de Gemini puede quedar esperando
// indefinidamente — y en producción, Render corta la conexión con un 502
// mucho antes de que eso pase, sin ninguna chance de reintentar.
const TIMEOUT_MS = 20_000;

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini devuelve 503 cuando el modelo está temporalmente sobrecargado del
// lado de Google (no es un error nuestro ni de los datos mandados); un
// GoogleGenerativeAIAbortError sale cuando se corta por el timeout de abajo
// (ver TIMEOUT_MS) — en ninguno de los dos casos hay nada mal con el pedido,
// así que reintenta un par de veces con espera creciente antes de rendirse.
// Otros errores (API key inválida, cuota agotada, etc.) no se benefician de
// reintentar, así que se relanzan de una.
const generarConReintento = async (
    modelo: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
    prompt: string
): Promise<GenerateContentResult> => {
    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        try {
            return await modelo.generateContent(prompt);
        } catch (error) {
            const esSobrecargaTemporal =
                (error instanceof GoogleGenerativeAIFetchError && error.status === 503) ||
                error instanceof GoogleGenerativeAIAbortError;

            if (!esSobrecargaTemporal || intento === MAX_INTENTOS) {
                throw error;
            }

            await esperar(ESPERA_BASE_MS * intento);
        }
    }

    // Inalcanzable: el loop siempre retorna o relanza en el último intento.
    throw new Error('No se pudo generar el análisis');
};

const armarPrompt = (historialMedico: AnalizarHistorialDTO['historialMedico']): string => {
    const entradas = historialMedico
        .map((e) => `- ${e.fecha} | Diagnóstico: ${e.diagnostico} | Tratamiento: ${e.tratamiento} | Médico: ${e.medico}`)
        .join('\n');

    return `Sos un asistente clínico. Analizá el siguiente historial médico de un paciente y respondé
ÚNICAMENTE con un objeto JSON (sin texto adicional, sin markdown) con exactamente estos campos:
{
  "resumenClinico": string (un resumen breve en español de la evolución del paciente),
  "medicamentosDetectados": string[] (lista de medicamentos/tratamientos mencionados),
  "nivelGravedad": "bajo" | "medio" | "alto" (tu evaluación del nivel de gravedad general)
}

Historial médico:
${entradas}`;
};

const analizarHistorial = async (req: Request<unknown, unknown, AnalizarHistorialDTO>, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return respuestaEstandar(
            res,
            503,
            false,
            'El servicio de análisis con IA todavía no está configurado (falta GEMINI_API_KEY en el .env)'
        );
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelo = genAI.getGenerativeModel(
            {
                model: 'gemini-3.8-flash',
                generationConfig: { responseMimeType: 'application/json' },
            },
            { timeout: TIMEOUT_MS }
        );

        const resultado = await generarConReintento(modelo, armarPrompt(req.body.historialMedico));
        const texto = resultado.response.text();

        let parseado: unknown;
        try {
            parseado = JSON.parse(texto);
        } catch {
            return respuestaEstandar(res, 502, false, 'La IA no devolvió un JSON válido');
        }

        const validado = ResultadoAnalisisSchema.safeParse(parseado);

        if (!validado.success) {
            return respuestaEstandar(res, 502, false, 'La IA devolvió un formato inesperado');
        }

        return respuestaEstandar(res, 200, true, 'Análisis generado exitosamente', validado.data);
    } catch (error: unknown) {
        return respuestaEstandar(res, 502, false, 'Error al consultar el servicio de IA', obtenerMensajeError(error));
    }
};

export { analizarHistorial };
