import type { Request, Response } from 'express';
import Consultorio from './Consultorio.model';
import type { CrearConsultorioDTO, ActualizarConsultorioDTO } from './dtos/consultorio.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';
import {
    esErrorDeValidacion,
    esErrorDeDuplicado,
    mensajesDeValidacion,
    campoDuplicado,
    obtenerMensajeError,
} from '../../utils/erroresMongo';

const getConsultorios = async (req: Request, res: Response) => {
    try {
        const consultorios = await Consultorio.find({ activo: true });
        return respuestaEstandar(res, 200, true, 'Consultorios obtenidos exitosamente', consultorios);
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los consultorios', obtenerMensajeError(error));
    }
};

const createConsultorio = async (req: Request<unknown, unknown, CrearConsultorioDTO>, res: Response) => {
    try {
        const nuevoConsultorio = await Consultorio.create(req.body);
        return respuestaEstandar(res, 201, true, 'Consultorio creado exitosamente', nuevoConsultorio);
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        if (esErrorDeDuplicado(error)) {
            return respuestaEstandar(res, 409, false, `Ya existe un consultorio registrado con ese ${campoDuplicado(error)}`);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el consultorio', obtenerMensajeError(error));
    }
};

const updateConsultorio = async (req: Request<{ id: string }, unknown, ActualizarConsultorioDTO>, res: Response) => {
    try {
        const { id } = req.params;
        const consultorioActualizado = await Consultorio.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!consultorioActualizado) {
            return respuestaEstandar(res, 404, false, 'Consultorio no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Consultorio actualizado exitosamente', consultorioActualizado);
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        if (esErrorDeDuplicado(error)) {
            return respuestaEstandar(res, 409, false, `Ya existe un consultorio registrado con ese ${campoDuplicado(error)}`);
        }

        return respuestaEstandar(res, 400, false, 'Error al actualizar el consultorio', obtenerMensajeError(error));
    }
};

const deleteConsultorio = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;
        const consultorioBorrado = await Consultorio.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!consultorioBorrado) {
            return respuestaEstandar(res, 404, false, 'Consultorio no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Consultorio eliminado exitosamente', consultorioBorrado);
    } catch (error: unknown) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', obtenerMensajeError(error));
    }
};

export { getConsultorios, createConsultorio, updateConsultorio, deleteConsultorio };
