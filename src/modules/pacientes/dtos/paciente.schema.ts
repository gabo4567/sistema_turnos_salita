import { z } from 'zod';
import { ObraSocial } from '../types/PacienteObraSocial.enum';
import { TipoTelefono } from '../types/PacienteTelefono.enum';
import { paginacionQuerySchema } from '../../../utils/paginacion';

const direccionSchema = z.object({
    calle: z.string({ error: 'La calle es obligatoria' }).min(1, 'La calle es obligatoria'),
    numero: z.string({ error: 'El número es obligatorio' }).min(1, 'El número es obligatorio'),
    piso: z.string().optional(),
    departamento: z.string().optional(),
    barrio: z.string().optional(),
});

const telefonoSchema = z.object({
    tipo: z.enum(TipoTelefono).optional(),
    codigoArea: z.string({ error: 'El código de área es obligatorio' }).regex(/^[0-9]{2,5}$/, 'El código de área no es válido'),
    numero: z.string({ error: 'El número de teléfono es obligatorio' }).regex(/^[0-9]{7,10}$/, 'El número de teléfono no es válido'),
});

const obraSocialSchema = z.object({
    nombre: z.enum(ObraSocial, { error: 'La obra social no es válida' }),
    numeroAfiliado: z.string().optional(),
});

export const CrearPacienteSchema = z.object({
    body: z.object({
        nombre: z.string({ error: 'El nombre del paciente es obligatorio' }).min(1, 'El nombre del paciente es obligatorio'),
        apellido: z.string({ error: 'El apellido del paciente es obligatorio' }).min(1, 'El apellido del paciente es obligatorio'),
        dni: z.string({ error: 'El DNI del paciente es obligatorio' }).regex(/^[0-9]{7,8}$/, 'El DNI debe tener 7 u 8 dígitos'),
        direccion: direccionSchema,
        email: z.email({ error: 'El correo electrónico es obligatorio o no es válido' }),
        telefono: telefonoSchema,
        obraSocial: obraSocialSchema,
    }),
});

export const ActualizarPacienteSchema = z.object({
    body: CrearPacienteSchema.shape.body.partial(),
});

export type CrearPacienteDTO = z.infer<typeof CrearPacienteSchema>['body'];
export type ActualizarPacienteDTO = z.infer<typeof ActualizarPacienteSchema>['body'];

export const OrdenPacientes = ['apellido_asc', 'apellido_desc', 'reciente', 'antiguo'] as const;

export const ListarPacientesSchema = z.object({
    query: z.object({
        obraSocial: z.string().optional(),
        dni: z.string().optional(),
        estado: z.string().optional(),
        busqueda: z.string().optional(),
        orden: z.enum(OrdenPacientes, { error: 'Orden no válido' }).optional(),
        ...paginacionQuerySchema,
    }),
});

export interface IQueryPacientes {
    obraSocial?: string;
    dni?: string;
    estado?: string;
    busqueda?: string;
    orden?: (typeof OrdenPacientes)[number];
    pagina?: string;
    limite?: string;
}
