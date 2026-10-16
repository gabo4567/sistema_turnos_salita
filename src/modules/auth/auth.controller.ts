import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../usuarios/Usuario.model';
import type { LoginDTO } from './dtos/auth.schema';

const login = async (req: Request<unknown, unknown, LoginDTO>, res: Response) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ email, activo: true }).select('+password');

        if (!usuario) {
            return res.status(401).json({ ok: false });
        }

        const passwordValida = await usuario.compararPassword(password);

        if (!passwordValida) {
            return res.status(401).json({ ok: false });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '8h' }
        );

        return res.json({ ok: true, token, nombre: usuario.nombre });
    } catch (error) {
        console.error('🔴 Error en login:', error);
        return res.status(500).json({ ok: false });
    }
};

export { login };
