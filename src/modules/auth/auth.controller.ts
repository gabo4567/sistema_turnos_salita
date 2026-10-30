import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Usuario from '../usuarios/Usuario.model';
import Paciente from '../pacientes/Paciente.model';
import type { LoginDTO, OlvidePasswordDTO, RestablecerPasswordDTO } from './dtos/auth.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';
import { obtenerMensajeError } from '../../utils/erroresMongo';
import { enviarMailRecuperacion } from '../../utils/enviarMail';

const MENSAJE_GENERICO_OLVIDE_PASSWORD =
    'Si el email corresponde a una cuenta de personal, te enviamos instrucciones para restablecer tu contraseña.';
const VENTANA_RESET_MS = 30 * 60 * 1000;

const hashearToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

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
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error al obtener el perfil', obtenerMensajeError(error));
    }
};

// Solo es para personal (admin/recepcionista/médico): el paciente no tiene
// contraseña real, así que su email nunca matchea nada acá (vive en la
// colección Paciente, no en Usuario). Responde siempre el mismo mensaje,
// exista o no la cuenta, para no revelar qué emails están registrados.
const olvidePassword = async (req: Request<unknown, unknown, OlvidePasswordDTO>, res: Response) => {
    try {
        const { email } = req.body;
        const usuario = await Usuario.findOne({ email, activo: true });

        if (usuario) {
            const token = crypto.randomBytes(32).toString('hex');

            usuario.resetTokenHash = hashearToken(token);
            usuario.resetTokenExpira = new Date(Date.now() + VENTANA_RESET_MS);
            await usuario.save();

            const link = `${process.env.FRONTEND_URL}/restablecer-password?token=${token}`;

            try {
                await enviarMailRecuperacion(usuario.email, usuario.nombre, link);
            } catch (error: unknown) {
                console.error('🔴 Error al enviar mail de recuperación:', obtenerMensajeError(error));
            }
        }

        return respuestaEstandar(res, 200, true, MENSAJE_GENERICO_OLVIDE_PASSWORD);
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error al procesar el pedido', obtenerMensajeError(error));
    }
};

const restablecerPassword = async (req: Request<unknown, unknown, RestablecerPasswordDTO>, res: Response) => {
    try {
        const { token, password } = req.body;
        const usuario = await Usuario.findOne({
            resetTokenHash: hashearToken(token),
            resetTokenExpira: { $gt: new Date() },
        }).select('+resetTokenHash +resetTokenExpira');

        if (!usuario) {
            return respuestaEstandar(res, 400, false, 'El enlace no es válido o ya venció. Pedí uno nuevo.');
        }

        usuario.password = password;
        usuario.resetTokenHash = undefined;
        usuario.resetTokenExpira = undefined;
        await usuario.save();

        return respuestaEstandar(res, 200, true, 'Contraseña actualizada correctamente');
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error al restablecer la contraseña', obtenerMensajeError(error));
    }
};

export { login, obtenerPerfil, olvidePassword, restablecerPassword };
