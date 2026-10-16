import type { Request, Response } from 'express';
import Medico from './Medico.model';
import type { CrearMedicoDTO, ActualizarMedicoDTO } from './dtos/medico.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';

const getMedicos = async (req: Request, res: Response) => {
    try {
        const medicos = await Medico.find({ activo: true });
        return respuestaEstandar(res, 200, true, 'Médicos obtenidos exitosamente', medicos);
    } catch (error: any) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los médicos', error.message);
    }
};

const createMedico = async (req: Request<unknown, unknown, CrearMedicoDTO>, res: Response) => {
    try {
        const nuevoMedico = await Medico.create(req.body);
        return respuestaEstandar(res, 201, true, 'Médico creado exitosamente', nuevoMedico);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        if (error.code === 11000) {
            const campo = Object.keys(error.keyValue ?? {})[0] ?? 'dato';
            return respuestaEstandar(res, 409, false, `Ya existe un médico registrado con ese ${campo}`);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el médico', error.message);
    }
};

const updateMedico = async (req: Request<{ id: string }, unknown, ActualizarMedicoDTO>, res: Response) => {
    try {
        const { id } = req.params;
        const medicoActualizado = await Medico.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!medicoActualizado) {
            return respuestaEstandar(res, 404, false, 'Médico no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Médico actualizado exitosamente', medicoActualizado);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        if (error.code === 11000) {
            const campo = Object.keys(error.keyValue ?? {})[0] ?? 'dato';
            return respuestaEstandar(res, 409, false, `Ya existe un médico registrado con ese ${campo}`);
        }

        return respuestaEstandar(res, 400, false, 'Error al actualizar el médico', error.message);
    }
};

const deleteMedico = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;
        const medicoBorrado = await Medico.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!medicoBorrado) {
            return respuestaEstandar(res, 404, false, 'Médico no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Médico eliminado exitosamente', medicoBorrado);
    } catch (error: any) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', error.message);
    }
};

export { getMedicos, createMedico, updateMedico, deleteMedico };
