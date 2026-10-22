import type { Response } from 'express';

export const respuestaEstandar = <T>(
    res: Response,
    statusCode: number,
    success: boolean,
    message: string,
    data?: T
): Response => {
    return res.status(statusCode).json({
        success,
        timestamp: new Date().toISOString(),
        message,
        total: Array.isArray(data) ? data.length : data ? 1 : 0,
        data
    });
};
