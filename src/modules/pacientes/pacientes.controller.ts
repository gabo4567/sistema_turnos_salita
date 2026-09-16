import type { Request, Response } from 'express';
import Paciente from './Paciente.model';
import type { CrearPacienteDTO, ActualizarPacienteDTO, IQueryPacientes } from './dtos/paciente.schema';

import { respuestaEstandar } from '../../utils/respuestaEstandar';

const getPacientes = async (req: Request<unknown, unknown, unknown, IQueryPacientes>, res: Response) => {
    try {
        const { obraSocial, dni } = req.query;
        const filtro: Record<string, string | boolean> = { activo: true };

        if (obraSocial) {
            filtro['obraSocial.nombre'] = obraSocial.toUpperCase();
        }

        if (dni) {
            filtro.dni = dni;
        }

        const pacientes = await Paciente.find(filtro);

        return respuestaEstandar(res, 200, true, 'Pacientes obtenidos exitosamente', pacientes);
    } catch (error: any) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los pacientes', error.message);
    }
};

const createPaciente = async (req: Request<unknown, unknown, CrearPacienteDTO>, res: Response) => {
    try {
        const nuevoPaciente = await Paciente.create(req.body);

        return respuestaEstandar(res, 201, true, 'Paciente creado exitosamente', nuevoPaciente);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el paciente', error.message);
    }
};

const updatePaciente = async (req: Request<{ id: string }, unknown, ActualizarPacienteDTO>, res: Response) => {
    try {
        const { id } = req.params;
        const pacienteActualizado = await Paciente.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!pacienteActualizado) {
            return respuestaEstandar(res, 404, false, 'Paciente no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Paciente actualizado exitosamente', pacienteActualizado);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        return respuestaEstandar(res, 400, false, 'Error al actualizar el paciente', error.message);
    }
};

const deletePaciente = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;
        const pacienteBorrado = await Paciente.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!pacienteBorrado) {
            return respuestaEstandar(res, 404, false, 'Paciente no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Paciente eliminado correctamente', pacienteBorrado);
    } catch (error: any) {
        return respuestaEstandar(res, 400, false, 'Error al eliminar el paciente', error.message);
    }
};

export { getPacientes, createPaciente, updatePaciente, deletePaciente };
