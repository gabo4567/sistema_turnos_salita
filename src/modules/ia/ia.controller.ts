import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ResultadoAnalisisSchema, type AnalizarHistorialDTO } from './dtos/analisisClinico.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';
import { obtenerMensajeError } from '../../utils/erroresMongo';

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
        const modelo = genAI.getGenerativeModel({
            model: 'gemini-flash-lite-latest',
            generationConfig: { responseMimeType: 'application/json' },
        });

        const resultado = await modelo.generateContent(armarPrompt(req.body.historialMedico));
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
