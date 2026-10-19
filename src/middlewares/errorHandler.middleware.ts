import type { Request, Response, NextFunction } from 'express';
import { respuestaEstandar } from '../utils/respuestaEstandar';

export const rutaNoEncontrada = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Ruta No Encontrada (404)',
        message: `La ruta ${req.originalUrl} no existe en el servidor`,
    });
};

// Red de seguridad: atrapa cualquier error que no haya sido manejado por un
// try/catch local (incluye errores síncronos y promesas rechazadas en
// handlers async, que Express 5 reenvía acá automáticamente). Sin esto,
// Express devuelve una página HTML en vez de JSON, lo que rompe el
// response.json() del frontend.
// Debe registrarse último en app.ts, después de todas las rutas y de
// rutaNoEncontrada, para que Express la reconozca como error handler
// (firma de 4 argumentos).
export const manejadorErrores = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error('🔴 Error no manejado:', error);
    return respuestaEstandar(res, 500, false, 'Error interno del servidor');
};
