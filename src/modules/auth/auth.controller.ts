import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../usuarios/Usuario.model';
import Paciente from '../pacientes/Paciente.model';
import type { LoginDTO } from './dtos/auth.schema';

const firmarToken = (payload: { id: string; rol: string; email?: string }) =>
    jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '8h' });

const login = async (req: Request<unknown, unknown, LoginDTO>, res: Response) => {
    try {
        const { usuario: identificador, password } = req.body;

        // 1) Personal (admin/recepcionista): se loguea con email + contraseña hasheada.
        const cuentaStaff = await Usuario.findOne({ email: identificador, activo: true }).select('+password');

        if (cuentaStaff) {
            const passwordValida = await cuentaStaff.compararPassword(password);

            if (!passwordValida) {
                return res.status(401).json({ ok: false });
            }

            const token = firmarToken({ id: cuentaStaff.id, rol: cuentaStaff.rol, email: cuentaStaff.email });
            return res.json({ ok: true, token, nombre: cuentaStaff.nombre, rol: cuentaStaff.rol });
        }

        // 2) Paciente: se loguea con su DNI como usuario y su teléfono como contraseña
        // (pedido así explícitamente por el profe, sin pantalla de cambio de contraseña).
        const paciente = await Paciente.findOne({ dni: identificador, activo: true });

        if (paciente && paciente.telefono?.numero === password) {
            const token = firmarToken({ id: paciente.id, rol: 'paciente' });
            return res.json({ ok: true, token, nombre: paciente.nombre, rol: 'paciente' });
        }

        return res.status(401).json({ ok: false });
    } catch (error) {
        console.error('🔴 Error en login:', error);
        return res.status(500).json({ ok: false });
    }
};

export { login };
