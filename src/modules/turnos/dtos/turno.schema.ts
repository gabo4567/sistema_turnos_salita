import { z } from 'zod';
import { Especialidad } from '../types/TurnoEspecialidad.enum';
import { EstadoTurno } from '../types/TurnoEstado.enum';

export const CrearTurnoSchema = z.object({
    body: z.object({
        paciente: z.string({ error: 'El ID del paciente es obligatorio' }).min(1, 'El ID del paciente es obligatorio'),
        especialidad: z.enum(Especialidad, { error: 'Especialidad no válida' }),
        medico: z.string({ error: 'El médico es obligatorio' }).min(1, 'El médico es obligatorio'),
        consultorio: z.string().optional(),
        fechaTurno: z.iso.datetime({ error: 'Formato de fecha inválido' }),
        estado: z.enum(EstadoTurno).optional(),
        observaciones: z.string().max(500, 'Las observaciones no pueden superar los 500 caracteres').optional(),
    }),
});

export const ActualizarTurnoSchema = z.object({
    body: CrearTurnoSchema.shape.body.partial(),
});

export type CrearTurnoDTO = z.infer<typeof CrearTurnoSchema>['body'];
export type ActualizarTurnoDTO = z.infer<typeof ActualizarTurnoSchema>['body'];

export interface IQueryUrgencia {
    urgencia?: string;
}
