import type { Request, Response } from 'express';
import Turno from './Turno.model';
import type { CrearTurnoDTO, ActualizarTurnoDTO, IQueryUrgencia } from './dtos/turno.schema';
import { EstadoTurno } from './types/TurnoEstado.enum';

import { respuestaEstandar } from '../../utils/respuestaEstandar';

const getTurnos = async (req: Request, res: Response) => {
    try {
        const turnos = await Turno.find({ activo: true }).populate('paciente').populate('medico').populate('consultorio');
        return respuestaEstandar(res, 200, true, 'Turnos obtenidos exitosamente', turnos);
    } catch (error: any) {
        return respuestaEstandar(res, 500, false, 'Error interno del servidor', error.message);
    }
};

const getTurnoPorId = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const turno = await Turno.findById(req.params.id).populate('paciente').populate('medico').populate('consultorio');

        if (!turno) {
            return respuestaEstandar(res, 404, false, 'Turno no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Turno obtenido exitosamente', turno);
    } catch (error: any) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', error.message);
    }
};

const createTurno = async (req: Request<unknown, unknown, CrearTurnoDTO, IQueryUrgencia>, res: Response) => {
    try {
        const origenPeticion = req.headers['x-origen'];
        const tokenSeguridad = req.headers['authorization'];

        console.log('🌎 Peticion realizada desde:', origenPeticion);

        if (tokenSeguridad != process.env.TURNOS_API_TOKEN) {
            return respuestaEstandar(res, 401, false, 'no tiene permisos');
        }

        const esUrgente = req.query.urgencia === 'true';

        const datosDelTurno: Record<string, any> = {
            paciente: req.body.paciente,
            especialidad: req.body.especialidad,
            medico: req.body.medico,
            consultorio: req.body.consultorio,
            fechaTurno: req.body.fechaTurno,
        };

        if (esUrgente) {
            datosDelTurno.estado = EstadoTurno.ATENDIDO;
            datosDelTurno.observaciones = 'ingreso por guardia medica';
            console.log('🚨 ALERTA: registrado un turno de urgencia');
        }

        const nuevoTurno = await Turno.create(datosDelTurno);
        return respuestaEstandar(res, 201, true, 'Turno creado exitosamente', nuevoTurno);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        return respuestaEstandar(res, 500, false, 'Error interno del servidor', error.message);
    }
};

const updateTurno = async (req: Request<{ id: string }, unknown, ActualizarTurnoDTO>, res: Response) => {
    try {
        const { id } = req.params;
        const turnoActualizado = await Turno.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        }).populate('paciente').populate('medico').populate('consultorio');

        if (!turnoActualizado) {
            return respuestaEstandar(res, 404, false, 'Turno no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Turno actualizado exitosamente', turnoActualizado);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        return respuestaEstandar(res, 400, false, 'Error al actualizar el turno', error.message);
    }
};

const marcarAtendido = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        const turnoActualizado = await Turno.findByIdAndUpdate(
            id,
            { estado: EstadoTurno.ATENDIDO },
            { new: true }
        ).populate('paciente').populate('medico').populate('consultorio');

        if (!turnoActualizado) {
            return respuestaEstandar(res, 404, false, 'Turno no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Turno marcado como atendido', turnoActualizado);
    } catch (error: any) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', error.message);
    }
};

const deleteTurno = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        const turnoBorrado = await Turno.findByIdAndUpdate(
            id,
            { activo: false, estado: EstadoTurno.CANCELADO },
            { new: true }
        );

        if (!turnoBorrado) {
            return respuestaEstandar(res, 404, false, `Turno no encontrado con ID ${id}`);
        }

        return respuestaEstandar(res, 200, true, 'Turno eliminado exitosamente', turnoBorrado);
    } catch (error: any) {
        console.error('Error al eliminar el turno:', error);
        return respuestaEstandar(res, 400, false, 'ID con formato invalido', error.message);
    }
};

export { getTurnos, getTurnoPorId, createTurno, updateTurno, marcarAtendido, deleteTurno };
