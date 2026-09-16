import { z } from 'zod';

export const LoginSchema = z.object({
    body: z.object({
        email: z.string({ error: 'El email es obligatorio' }).min(1, 'El email es obligatorio'),
        password: z.string({ error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria'),
    }),
});

export type LoginDTO = z.infer<typeof LoginSchema>['body'];
