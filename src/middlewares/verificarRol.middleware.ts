import type { Request, Response, NextFunction } from 'express';
import { respuestaEstandar } from '../utils/respuestaEstandar';

// Debe ir siempre después de verificarToken (necesita req.usuario ya cargado).
export const verificarRol = (...rolesPermitidos: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return respuestaEstandar(res, 403, false, 'No tenés permisos para realizar esta acción');
        }

        next();
    };
