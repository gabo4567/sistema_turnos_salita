import type { Response } from 'express';

// `extra` es opcional y se mezcla en el nivel superior de la respuesta (no
// dentro de `data`), para listados paginados: pagina, limite, totalRegistros,
// totalPaginas. Ningún llamado existente lo manda, así que no cambia nada
// para el resto de los endpoints.
export const respuestaEstandar = <T>(
    res: Response,
    statusCode: number,
    success: boolean,
    message: string,
    data?: T,
    extra?: Record<string, unknown>
): Response => {
    return res.status(statusCode).json({
        success,
        timestamp: new Date().toISOString(),
        message,
        total: Array.isArray(data) ? data.length : data ? 1 : 0,
        data,
        ...extra,
    });
};
