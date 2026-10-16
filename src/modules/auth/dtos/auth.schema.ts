import { z } from 'zod';

// "usuario" es genérico a propósito: el personal (admin/recepcionista) ingresa
// su email, y el paciente ingresa su DNI (con su teléfono como contraseña).
export const LoginSchema = z.object({
    body: z.object({
        usuario: z.string({ error: 'El usuario es obligatorio' }).min(1, 'El usuario es obligatorio'),
        password: z.string({ error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria'),
    }),
});

export type LoginDTO = z.infer<typeof LoginSchema>['body'];
