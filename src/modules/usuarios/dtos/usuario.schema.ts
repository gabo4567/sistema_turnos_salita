import { z } from 'zod';
import { RolUsuario } from '../types/RolUsuario.enum';

export const CrearUsuarioSchema = z.object({
    body: z.object({
        nombre: z.string({ error: 'El nombre es obligatorio' }).min(1, 'El nombre es obligatorio'),
        email: z.string({ error: 'El email es obligatorio' }).email('El email no es válido'),
        password: z.string({ error: 'La contraseña es obligatoria' }).min(4, 'La contraseña debe tener al menos 4 caracteres'),
        rol: z.enum(RolUsuario, { error: 'Rol no válido' }),
    }),
});

export const ActualizarUsuarioSchema = z.object({
    body: CrearUsuarioSchema.shape.body.partial(),
});

export type CrearUsuarioDTO = z.infer<typeof CrearUsuarioSchema>['body'];
export type ActualizarUsuarioDTO = z.infer<typeof ActualizarUsuarioSchema>['body'];
