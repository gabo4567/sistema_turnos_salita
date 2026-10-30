import rateLimit from 'express-rate-limit';
import { respuestaEstandar } from '../utils/respuestaEstandar';

// Evita que manden mails de recuperación en cadena a cualquier email ajeno:
// máximo 5 pedidos por IP cada 15 minutos.
export const limitarReset = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        respuestaEstandar(res, 429, false, 'Demasiados intentos. Esperá unos minutos y volvé a intentar.');
    },
});
