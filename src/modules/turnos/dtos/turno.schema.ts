import { z } from 'zod';
import { Especialidad } from '../types/TurnoEspecialidad.enum';
import { EstadoTurno } from '../types/TurnoEstado.enum';

export const esHorarioEnMediaHora = (valor: string): boolean => {
    const fecha = new Date(valor);
    return fecha.getUTCMinutes() % 30 === 0 && fecha.getUTCSeconds() === 0 && fecha.getUTCMilliseconds() === 0;
};

const MENSAJE_MEDIA_HORA = 'El turno debe ser en punto o a la media hora (ej. 10:00 o 10:30)';

export const CrearTurnoSchema = z.object({
    body: z.object({
        paciente: z.string({ error: 'El ID del paciente es obligatorio' }).min(1, 'El ID del paciente es obligatorio'),
        especialidad: z.enum(Especialidad, { error: 'Especialidad no válida' }),
        medico: z.string({ error: 'El médico es obligatorio' }).min(1, 'El médico es obligatorio'),
        consultorio: z.string().optional(),
        fechaTurno: z.iso.datetime({ error: 'Formato de fecha inválido' }).refine(esHorarioEnMediaHora, MENSAJE_MEDIA_HORA),
        estado: z.enum(EstadoTurno).optional(),
        observaciones: z.string().max(500, 'El motivo no puede superar los 500 caracteres').optional(),
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
