import { z } from 'zod';
import { CrearPacienteSchema } from '../../pacientes/dtos/paciente.schema';
import { Especialidad } from '../../turnos/types/TurnoEspecialidad.enum';
import { EstadoTurno } from '../../turnos/types/TurnoEstado.enum';
import { esHorarioEnMediaHora } from '../../turnos/dtos/turno.schema';

const MENSAJE_MEDIA_HORA = 'El turno debe ser en punto o a la media hora (ej. 10:00 o 10:30)';

export const RegistrarIngresoSchema = z.object({
    body: z.object({
        datosPaciente: CrearPacienteSchema.shape.body,
        especialidad: z.enum(Especialidad, { error: 'Especialidad no válida' }),
        medico: z.string({ error: 'El médico es obligatorio' }).min(1, 'El médico es obligatorio'),
        consultorio: z.string().optional(),
        fechaTurno: z.iso.datetime({ error: 'Formato de fecha inválido' }).refine(esHorarioEnMediaHora, MENSAJE_MEDIA_HORA),
        estado: z.enum(EstadoTurno).optional(),
        observaciones: z.string().max(500, 'Las observaciones no pueden superar los 500 caracteres').optional(),
    }),
});

export type RegistrarIngresoDTO = z.infer<typeof RegistrarIngresoSchema>['body'];
