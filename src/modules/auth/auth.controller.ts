import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../usuarios/Usuario.model';
import Paciente from '../pacientes/Paciente.model';
import type { LoginDTO } from './dtos/auth.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';

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

// Devuelve los datos del usuario logueado (sea cual sea su rol), para mostrar
// en un panel de "mi perfil". No hay un solo modelo para los 3 roles: admin
// y recepcionista viven en Usuario, paciente vive en Paciente.
const obtenerPerfil = async (req: Request, res: Response) => {
    try {
        if (!req.usuario) {
            return respuestaEstandar(res, 401, false, 'No se envió un token de autenticación');
        }

        if (req.usuario.rol === 'paciente') {
            const paciente = await Paciente.findById(req.usuario.id);

            if (!paciente) {
                return respuestaEstandar(res, 404, false, 'Paciente no encontrado');
            }

            return respuestaEstandar(res, 200, true, 'Perfil obtenido exitosamente', {
                rol: 'paciente',
                nombre: paciente.nombre,
                dni: paciente.dni,
                email: paciente.email,
                telefono: paciente.telefono,
                direccion: paciente.direccion,
                obraSocial: paciente.obraSocial,
            });
        }

        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario) {
            return respuestaEstandar(res, 404, false, 'Usuario no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Perfil obtenido exitosamente', {
            rol: usuario.rol,
            nombre: usuario.nombre,
            email: usuario.email,
        });
    } catch (error: any) {
        return respuestaEstandar(res, 500, false, 'Error al obtener el perfil', error.message);
    }
};

export { login, obtenerPerfil };
