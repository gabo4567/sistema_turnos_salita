import type { Request, Response } from 'express';
import Usuario from './Usuario.model';
import type { CrearUsuarioDTO, ActualizarUsuarioDTO } from './dtos/usuario.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';

const getUsuarios = async (req: Request, res: Response) => {
    try {
        const usuarios = await Usuario.find({ activo: true });
        return respuestaEstandar(res, 200, true, 'Usuarios obtenidos exitosamente', usuarios);
    } catch (error: any) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los usuarios', error.message);
    }
};

const createUsuario = async (req: Request<unknown, unknown, CrearUsuarioDTO>, res: Response) => {
    try {
        const nuevoUsuario = await Usuario.create(req.body);
        return respuestaEstandar(res, 201, true, 'Usuario creado exitosamente', nuevoUsuario);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        if (error.code === 11000) {
            const campo = Object.keys(error.keyValue ?? {})[0] ?? 'dato';
            return respuestaEstandar(res, 409, false, `Ya existe un usuario registrado con ese ${campo}`);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el usuario', error.message);
    }
};

const updateUsuario = async (req: Request<{ id: string }, unknown, ActualizarUsuarioDTO>, res: Response) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findOne({ _id: id, activo: true }).select('+password');

        if (!usuario) {
            return respuestaEstandar(res, 404, false, 'Usuario no encontrado');
        }

        // Object.assign + save() (no findByIdAndUpdate) a propósito: así corre el
        // hook pre('save') que hashea la contraseña cuando viene en el body.
        Object.assign(usuario, req.body);
        await usuario.save();

        return respuestaEstandar(res, 200, true, 'Usuario actualizado exitosamente', usuario);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        if (error.code === 11000) {
            const campo = Object.keys(error.keyValue ?? {})[0] ?? 'dato';
            return respuestaEstandar(res, 409, false, `Ya existe un usuario registrado con ese ${campo}`);
        }

        return respuestaEstandar(res, 400, false, 'Error al actualizar el usuario', error.message);
    }
};

const deleteUsuario = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        if (req.usuario?.id === id) {
            return respuestaEstandar(res, 400, false, 'No podés dar de baja tu propia cuenta');
        }

        const usuarioBorrado = await Usuario.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!usuarioBorrado) {
            return respuestaEstandar(res, 404, false, 'Usuario no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Usuario eliminado exitosamente', usuarioBorrado);
    } catch (error: any) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', error.message);
    }
};

export { getUsuarios, createUsuario, updateUsuario, deleteUsuario };
