import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Paciente from '../pacientes/Paciente.model';
import Turno from '../turnos/Turno.model';
import type { RegistrarIngresoDTO } from './dtos/recepcion.schema';
import { EstadoTurno } from '../turnos/types/TurnoEstado.enum';

import { respuestaEstandar } from '../../utils/respuestaEstandar';

const registrarIngreso = async (req: Request<unknown, unknown, RegistrarIngresoDTO>, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { datosPaciente, especialidad, fechaTurno, estado, observaciones, medico, consultorio } = req.body;

        const [nuevoPaciente] = await Paciente.create([datosPaciente], { session });
        if (!nuevoPaciente) {
            throw new Error('No se pudo crear el paciente');
        }

        const [nuevoTurno] = await Turno.create([{
            paciente: nuevoPaciente._id,
            especialidad,
            fechaTurno,
            estado: estado || EstadoTurno.PENDIENTE,
            observaciones,
            medico,
            consultorio,
        }], { session });

        if (!nuevoTurno) {
            throw new Error('No se pudo crear el turno');
        }

        await session.commitTransaction();
        session.endSession();

        const turnoCompleto = await Turno.findById(nuevoTurno.id).populate('paciente').populate('medico').populate('consultorio');

        return respuestaEstandar(res, 201, true, 'ingreso paciente nuevo', turnoCompleto);
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();

        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        return respuestaEstandar(res, 400, false, 'transaccion abortada', error.message);
    }
};

export { registrarIngreso };
