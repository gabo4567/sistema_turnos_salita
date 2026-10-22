import type { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { respuestaEstandar } from '../utils/respuestaEstandar';

export const validarSchema = (schema: ZodObject) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errores = error.issues.map((issue) => issue.message);
                return respuestaEstandar(res, 400, false, 'Error de validación', errores);
            }
            next(error);
        }
    };
