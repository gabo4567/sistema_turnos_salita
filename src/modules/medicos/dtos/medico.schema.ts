import { z } from 'zod';
import { Especialidad } from '../../turnos/types/TurnoEspecialidad.enum';
import { paginacionQuerySchema } from '../../../utils/paginacion';

// Teléfono obligatorio (lo usa el médico para editar el suyo propio).
const telefonoMedicoSchema = z.object({
    codigoArea: z.string({ error: 'El código de área es obligatorio' }).regex(/^[0-9]{2,5}$/, 'El código de área no es válido'),
    numero: z.string({ error: 'El número de teléfono es obligatorio' }).regex(/^[0-9]{7,10}$/, 'El número de teléfono no es válido'),
});

// Teléfono opcional (alta/edición por admin): el formulario siempre manda
// un objeto (nunca "undefined"), así que dejar los dos campos vacíos
// también es válido — significa "sin teléfono cargado".
const telefonoMedicoOpcionalSchema = z
    .object({
        codigoArea: z.string(),
        numero: z.string(),
    })
    .refine(
        (valor) =>
            (valor.codigoArea === '' && valor.numero === '') ||
            (/^[0-9]{2,5}$/.test(valor.codigoArea) && /^[0-9]{7,10}$/.test(valor.numero)),
        { message: 'Completá código de área y número, o dejá los dos vacíos', path: ['numero'] }
    );

// Horario de atención de la salita: ningún bloque de un médico puede salirse
// de este rango. 1=lunes...6=sábado (coincide con Date.getUTCDay()); domingo
// no es una opción, la salita no abre ese día.
export const HORA_APERTURA_SALITA = '08:00';
export const HORA_CIERRE_SALITA = '20:00';
const HORA_REGEX = /^([01]\d|2[0-3]):(00|30)$/;

const bloqueHorarioSchema = z
    .object({
        diaSemana: z.number({ error: 'El día no es válido' }).int().min(1, 'El día no es válido').max(6, 'El día no es válido'),
        horaInicio: z.string({ error: 'La hora de inicio es obligatoria' }).regex(HORA_REGEX, 'Hora inválida'),
        horaFin: z.string({ error: 'La hora de fin es obligatoria' }).regex(HORA_REGEX, 'Hora inválida'),
    })
    .refine((bloque) => bloque.horaInicio < bloque.horaFin, {
        message: 'La hora de inicio debe ser anterior a la de fin',
        path: ['horaFin'],
    })
    .refine((bloque) => bloque.horaInicio >= HORA_APERTURA_SALITA && bloque.horaFin <= HORA_CIERRE_SALITA, {
        message: `El horario debe estar entre las ${HORA_APERTURA_SALITA} y las ${HORA_CIERRE_SALITA}`,
        path: ['horaInicio'],
    });

// Vacío = sin horario configurado: validarDisponibilidadTurno lo trata como
// "atiende de lunes a viernes, horario completo" (el comportamiento de
// siempre), para no romper la agenda de médicos que ya tienen turnos
// mientras nadie carga su horario real todavía.
const horariosMedicoSchema = z
    .array(bloqueHorarioSchema)
    .max(6, 'No puede haber más de un bloque por día')
    .refine((bloques) => new Set(bloques.map((b) => b.diaSemana)).size === bloques.length, {
        message: 'No se puede repetir el mismo día dos veces',
    });

export const CrearMedicoSchema = z.object({
    body: z.object({
        nombre: z.string({ error: 'El nombre es obligatorio' }).min(1, 'El nombre es obligatorio'),
        apellido: z.string({ error: 'El apellido es obligatorio' }).min(1, 'El apellido es obligatorio'),
        especialidades: z
            .array(z.enum(Especialidad, { error: 'Especialidad no válida' }))
            .min(1, 'Debe indicar al menos una especialidad'),
        matricula: z.string({ error: 'La matrícula es obligatoria' }).min(1, 'La matrícula es obligatoria'),
        telefono: telefonoMedicoOpcionalSchema.optional(),
        cupoMaximo: z.number({ error: 'El cupo máximo debe ser un número' }).int().positive('El cupo máximo debe ser mayor a 0').optional(),
        horarios: horariosMedicoSchema.optional(),
        // Datos de la cuenta de acceso (Usuario) que se crea junto con el médico.
        email: z.email({ error: 'El email es obligatorio o no es válido' }),
        password: z.string({ error: 'La contraseña es obligatoria' }).min(4, 'La contraseña debe tener al menos 4 caracteres'),
    }),
});

// Edición por Admin o Recepcionista: cualquier campo propio del médico,
// incluido el email de su cuenta (no la contraseña, eso se administra desde
// el módulo de Usuarios).
export const ActualizarMedicoSchema = z.object({
    body: CrearMedicoSchema.shape.body.omit({ password: true }).partial(),
});

// Edición por el propio Médico: solo puede cambiar su teléfono y su horario
// de atención (nombre, apellido, matrícula y email quedan en manos de
// admin/recepcionista).
export const ActualizarPerfilPropioMedicoSchema = z.object({
    body: z.object({
        telefono: telefonoMedicoSchema,
        horarios: horariosMedicoSchema,
    }),
});

export type CrearMedicoDTO = z.infer<typeof CrearMedicoSchema>['body'];
export type ActualizarMedicoDTO = z.infer<typeof ActualizarMedicoSchema>['body'];
export type ActualizarPerfilPropioMedicoDTO = z.infer<typeof ActualizarPerfilPropioMedicoSchema>['body'];

export const OrdenMedicos = ['apellido_asc', 'apellido_desc', 'reciente', 'antiguo'] as const;

export const ListarMedicosSchema = z.object({
    query: z.object({
        especialidad: z.string().optional(),
        busqueda: z.string().optional(),
        estado: z.string().optional(),
        orden: z.enum(OrdenMedicos, { error: 'Orden no válido' }).optional(),
        ...paginacionQuerySchema,
    }),
});
