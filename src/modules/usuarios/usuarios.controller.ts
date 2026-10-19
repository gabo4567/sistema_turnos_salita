import type { Request, Response } from 'express';
import Usuario from './Usuario.model';
import type { CrearUsuarioDTO, ActualizarUsuarioDTO } from './dtos/usuario.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';
import {
    esErrorDeValidacion,
    esErrorDeDuplicado,
    mensajesDeValidacion,
    campoDuplicado,
    obtenerMensajeError,
} from '../../utils/erroresMongo';

const getUsuarios = async (req: Request, res: Response) => {
    try {
        const usuarios = await Usuario.find({ activo: true });
        return respuestaEstandar(res, 200, true, 'Usuarios obtenidos exitosamente', usuarios);
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los usuarios', obtenerMensajeError(error));
    }
};

const createUsuario = async (req: Request<unknown, unknown, CrearUsuarioDTO>, res: Response) => {
    try {
        const nuevoUsuario = await Usuario.create(req.body);
        return respuestaEstandar(res, 201, true, 'Usuario creado exitosamente', nuevoUsuario);
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        if (esErrorDeDuplicado(error)) {
            return respuestaEstandar(res, 409, false, `Ya existe un usuario registrado con ese ${campoDuplicado(error)}`);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el usuario', obtenerMensajeError(error));
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
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        if (esErrorDeDuplicado(error)) {
            return respuestaEstandar(res, 409, false, `Ya existe un usuario registrado con ese ${campoDuplicado(error)}`);
        }

        return respuestaEstandar(res, 400, false, 'Error al actualizar el usuario', obtenerMensajeError(error));
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
    } catch (error: unknown) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', obtenerMensajeError(error));
    }
};

export { getUsuarios, createUsuario, updateUsuario, deleteUsuario };
