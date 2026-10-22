import { z } from 'zod';

const entradaHistorialSchema = z.object({
    fecha: z.string(),
    diagnostico: z.string(),
    tratamiento: z.string(),
    medico: z.string(),
});

export const AnalizarHistorialSchema = z.object({
    body: z.object({
        historialMedico: z
            .array(entradaHistorialSchema)
            .min(1, 'Hace falta al menos una entrada del historial médico para analizar'),
    }),
});

export type AnalizarHistorialDTO = z.infer<typeof AnalizarHistorialSchema>['body'];

// Contrato de salida que le exigimos a Gemini. Si la IA "alucina" el formato
// (le falta un campo, inventa un valor de nivelGravedad que no es ninguno de
// los tres permitidos, etc.), ResultadoAnalisisSchema.safeParse(...) lo detecta
// antes de que ese dato le llegue al frontend.
export const ResultadoAnalisisSchema = z.object({
    resumenClinico: z.string(),
    medicamentosDetectados: z.array(z.string()),
    nivelGravedad: z.enum(['bajo', 'medio', 'alto']),
});

export type ResultadoAnalisis = z.infer<typeof ResultadoAnalisisSchema>;
