import { z } from 'zod';
import { Especialidad } from '../../turnos/types/TurnoEspecialidad.enum';

export const CrearMedicoSchema = z.object({
    body: z.object({
        nombre: z.string({ error: 'El nombre es obligatorio' }).min(1, 'El nombre es obligatorio'),
        especialidad: z.enum(Especialidad, { error: 'Especialidad no válida' }),
        matricula: z.string({ error: 'La matrícula es obligatoria' }).min(1, 'La matrícula es obligatoria'),
        telefono: z.string().optional(),
        cupoMaximo: z.number({ error: 'El cupo máximo debe ser un número' }).int().positive('El cupo máximo debe ser mayor a 0').optional(),
    }),
});

export const ActualizarMedicoSchema = z.object({
    body: CrearMedicoSchema.shape.body.partial(),
});

export type CrearMedicoDTO = z.infer<typeof CrearMedicoSchema>['body'];
export type ActualizarMedicoDTO = z.infer<typeof ActualizarMedicoSchema>['body'];
