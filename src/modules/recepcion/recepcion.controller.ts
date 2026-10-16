import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Paciente from '../pacientes/Paciente.model';
import Turno from '../turnos/Turno.model';
import type { RegistrarIngresoDTO } from './dtos/recepcion.schema';
import { EstadoTurno } from '../turnos/types/TurnoEstado.enum';
import { validarDisponibilidadTurno } from '../turnos/validarDisponibilidadTurno';

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

        // El paciente recién se creó en esta misma transacción, así que no
        // puede tener turnos pendientes previos: solo importa el lado del
        // médico (horario ocupado y cupo diario).
        const disponibilidad = await validarDisponibilidadTurno(
            { paciente: nuevoPaciente._id.toString(), medico, fechaTurno },
            { omitirCupoYPendiente: false, session }
        );

        if (!disponibilidad.valido) {
            await session.abortTransaction();
            session.endSession();
            return respuestaEstandar(res, disponibilidad.status, false, disponibilidad.mensaje);
        }

        const [nuevoTurno] = await Turno.create([{
            paciente: nuevoPaciente._id,
            especialidad,
            fechaTurno,
            estado: estado || EstadoTurno.PENDIENTE,
            observaciones,
            medico,
            // '' (ningún consultorio elegido) no es un ObjectId válido para Mongo.
            consultorio: consultorio || undefined,
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

        if (error.code === 11000) {
            const campo = Object.keys(error.keyValue ?? {})[0] ?? 'dato';
            return respuestaEstandar(res, 409, false, `Ya existe un paciente registrado con ese ${campo}`);
        }

        if (error.name === 'MongooseError' && error.message?.includes('único')) {
            return respuestaEstandar(res, 409, false, error.message);
        }

        return respuestaEstandar(res, 400, false, 'transaccion abortada', error.message);
    }
};

export { registrarIngreso };
