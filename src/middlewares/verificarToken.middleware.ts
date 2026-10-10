import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { respuestaEstandar } from '../utils/respuestaEstandar';

interface PayloadToken {
    id: string;
    email: string;
}

export const verificarToken = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers['authorization'];

    if (!header || !header.startsWith('Bearer ')) {
        return respuestaEstandar(res, 401, false, 'No se envió un token de autenticación');
    }

    const token = header.slice('Bearer '.length);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as PayloadToken;
        req.usuario = { id: payload.id, email: payload.email };
        next();
    } catch {
        return respuestaEstandar(res, 401, false, 'Token inválido o expirado');
    }
};
