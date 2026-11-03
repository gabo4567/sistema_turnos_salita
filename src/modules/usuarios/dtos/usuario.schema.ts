import { z } from 'zod';
import { RolUsuario } from '../types/RolUsuario.enum';
import { paginacionQuerySchema } from '../../../utils/paginacion';

export const CrearUsuarioSchema = z.object({
    body: z.object({
        nombre: z.string({ error: 'El nombre es obligatorio' }).min(1, 'El nombre es obligatorio'),
        email: z.email({ error: 'El email es obligatorio o no es válido' }),
        password: z.string({ error: 'La contraseña es obligatoria' }).min(4, 'La contraseña debe tener al menos 4 caracteres'),
        rol: z.enum(RolUsuario, { error: 'Rol no válido' }),
    }),
});

export const ActualizarUsuarioSchema = z.object({
    body: CrearUsuarioSchema.shape.body.partial(),
});

export type CrearUsuarioDTO = z.infer<typeof CrearUsuarioSchema>['body'];
export type ActualizarUsuarioDTO = z.infer<typeof ActualizarUsuarioSchema>['body'];

export const OrdenUsuarios = ['nombre_asc', 'nombre_desc', 'reciente', 'antiguo'] as const;

export const ListarUsuariosSchema = z.object({
    query: z.object({
        rol: z.enum(RolUsuario, { error: 'Rol no válido' }).optional(),
        estado: z.string().optional(),
        busqueda: z.string().optional(),
        orden: z.enum(OrdenUsuarios, { error: 'Orden no válido' }).optional(),
        ...paginacionQuerySchema,
    }),
});
