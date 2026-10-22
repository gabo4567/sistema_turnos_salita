import { z } from 'zod';

export const CrearConsultorioSchema = z.object({
    body: z.object({
        numero: z.string({ error: 'El número de consultorio es obligatorio' }).min(1, 'El número de consultorio es obligatorio'),
        piso: z.string().optional(),
        especialidad: z.string().optional(),
    }),
});

export const ActualizarConsultorioSchema = z.object({
    body: CrearConsultorioSchema.shape.body.partial(),
});

export type CrearConsultorioDTO = z.infer<typeof CrearConsultorioSchema>['body'];
export type ActualizarConsultorioDTO = z.infer<typeof ActualizarConsultorioSchema>['body'];
