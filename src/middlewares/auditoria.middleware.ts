import type { Request, Response, NextFunction } from 'express';

const auditoriaMunicipal = (req: Request, res: Response, next: NextFunction) => {
    const horaActual = new Date().toLocaleTimeString();
    const metodo = req.method;
    const ruta = req.originalUrl;

    console.log(`[${horaActual}] ${metodo} ${ruta}`);

    next();
};

export default auditoriaMunicipal;
