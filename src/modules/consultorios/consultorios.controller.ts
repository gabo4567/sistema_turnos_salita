import type { Request, Response } from 'express';
import Consultorio from './Consultorio.model';
import type { CrearConsultorioDTO, ActualizarConsultorioDTO } from './dtos/consultorio.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';

const getConsultorios = async (req: Request, res: Response) => {
    try {
        const consultorios = await Consultorio.find({ activo: true });
        return respuestaEstandar(res, 200, true, 'Consultorios obtenidos exitosamente', consultorios);
    } catch (error: any) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los consultorios', error.message);
    }
};

const createConsultorio = async (req: Request<unknown, unknown, CrearConsultorioDTO>, res: Response) => {
    try {
        const nuevoConsultorio = await Consultorio.create(req.body);
        return respuestaEstandar(res, 201, true, 'Consultorio creado exitosamente', nuevoConsultorio);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        if (error.code === 11000) {
            const campo = Object.keys(error.keyValue ?? {})[0] ?? 'dato';
            return respuestaEstandar(res, 409, false, `Ya existe un consultorio registrado con ese ${campo}`);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el consultorio', error.message);
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
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        if (error.code === 11000) {
            const campo = Object.keys(error.keyValue ?? {})[0] ?? 'dato';
            return respuestaEstandar(res, 409, false, `Ya existe un consultorio registrado con ese ${campo}`);
        }

        return respuestaEstandar(res, 400, false, 'Error al actualizar el consultorio', error.message);
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
    } catch (error: any) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', error.message);
    }
};

export { getConsultorios, createConsultorio, updateConsultorio, deleteConsultorio };
