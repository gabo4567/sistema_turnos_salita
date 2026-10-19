import type { Request, Response } from 'express';
import Paciente from './Paciente.model';
import type { CrearPacienteDTO, ActualizarPacienteDTO, IQueryPacientes } from './dtos/paciente.schema';

import { respuestaEstandar } from '../../utils/respuestaEstandar';
import {
    esErrorDeValidacion,
    esErrorDeDuplicado,
    esErrorDeUnicoConMensaje,
    mensajesDeValidacion,
    campoDuplicado,
    obtenerMensajeError,
} from '../../utils/erroresMongo';

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
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los pacientes', obtenerMensajeError(error));
    }
};

const createPaciente = async (req: Request<unknown, unknown, CrearPacienteDTO>, res: Response) => {
    try {
        const nuevoPaciente = await Paciente.create(req.body);

        return respuestaEstandar(res, 201, true, 'Paciente creado exitosamente', nuevoPaciente);
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        if (esErrorDeDuplicado(error)) {
            return respuestaEstandar(res, 409, false, `Ya existe un paciente registrado con ese ${campoDuplicado(error)}`);
        }

        if (esErrorDeUnicoConMensaje(error)) {
            return respuestaEstandar(res, 409, false, error.message);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el paciente', obtenerMensajeError(error));
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
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        if (esErrorDeDuplicado(error)) {
            return respuestaEstandar(res, 409, false, `Ya existe un paciente registrado con ese ${campoDuplicado(error)}`);
        }

        if (esErrorDeUnicoConMensaje(error)) {
            return respuestaEstandar(res, 409, false, error.message);
        }

        return respuestaEstandar(res, 400, false, 'Error al actualizar el paciente', obtenerMensajeError(error));
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
    } catch (error: unknown) {
        return respuestaEstandar(res, 400, false, 'Error al eliminar el paciente', obtenerMensajeError(error));
    }
};

export { getPacientes, createPaciente, updatePaciente, deletePaciente };
