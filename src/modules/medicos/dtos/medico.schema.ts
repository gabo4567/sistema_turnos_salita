import { z } from 'zod';
import { Especialidad } from '../../turnos/types/TurnoEspecialidad.enum';

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
        // Datos de la cuenta de acceso (Usuario) que se crea junto con el médico.
        email: z.email({ error: 'El email es obligatorio o no es válido' }),
        password: z.string({ error: 'La contraseña es obligatoria' }).min(4, 'La contraseña debe tener al menos 4 caracteres'),
    }),
});

// Edición por Admin: cualquier campo propio del médico (no toca email/password,
// eso se administra desde el módulo de Usuarios).
export const ActualizarMedicoSchema = z.object({
    body: CrearMedicoSchema.shape.body.omit({ email: true, password: true }).partial(),
});

// Edición por el propio Médico: solo puede cambiar su teléfono.
export const ActualizarTelefonoMedicoSchema = z.object({
    body: z.object({
        telefono: telefonoMedicoSchema,
    }),
});

export type CrearMedicoDTO = z.infer<typeof CrearMedicoSchema>['body'];
export type ActualizarMedicoDTO = z.infer<typeof ActualizarMedicoSchema>['body'];
