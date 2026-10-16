import type { ClientSession } from 'mongoose';
import Turno from './Turno.model';
import Medico from '../medicos/Medico.model';
import { EstadoTurno } from './types/TurnoEstado.enum';

interface DatosTurno {
    paciente: string;
    medico: string;
    fechaTurno: string | Date;
}

interface OpcionesValidacion {
    // Los turnos de urgencia (guardia) y las altas de recepción con paciente
    // recién creado no tienen "turno pendiente" previo que chequear, y la
    // urgencia además ignora el cupo diario a propósito.
    omitirCupoYPendiente?: boolean;
    session?: ClientSession;
    // Al editar un turno existente, hay que excluirlo a sí mismo de los
    // chequeos de horario ocupado (si no, siempre "chocaría" consigo mismo).
    excluirTurnoId?: string;
}

type ResultadoValidacion = { valido: true } | { valido: false; status: number; mensaje: string };

// Chequeos de disponibilidad compartidos entre createTurno (Nuevo Turno) y
// registrarIngreso (Nueva Recepción), para que las dos vías de alta de
// turnos respeten las mismas reglas: horario ocupado (médico y paciente),
// turno pendiente duplicado, y cupo máximo diario del médico.
export const validarDisponibilidadTurno = async (
    datos: DatosTurno,
    opciones: OpcionesValidacion = {}
): Promise<ResultadoValidacion> => {
    const { session, omitirCupoYPendiente = false, excluirTurnoId } = opciones;
    const filtroExclusion = excluirTurnoId ? { _id: { $ne: excluirTurnoId } } : {};

    const turnoOcupado = await Turno.findOne({
        ...filtroExclusion,
        medico: datos.medico,
        fechaTurno: datos.fechaTurno,
        activo: true,
    }).session(session ?? null);

    if (turnoOcupado) {
        return { valido: false, status: 409, mensaje: 'El médico ya tiene un turno asignado en ese horario' };
    }

    const pacienteOcupado = await Turno.findOne({
        ...filtroExclusion,
        paciente: datos.paciente,
        fechaTurno: datos.fechaTurno,
        activo: true,
    }).session(session ?? null);

    if (pacienteOcupado) {
        return { valido: false, status: 409, mensaje: 'El paciente ya tiene otro turno asignado en ese horario' };
    }

    if (omitirCupoYPendiente) {
        return { valido: true };
    }

    const turnoPendienteConMedico = await Turno.findOne({
        paciente: datos.paciente,
        medico: datos.medico,
        activo: true,
        estado: { $ne: EstadoTurno.ATENDIDO },
    }).session(session ?? null);

    if (turnoPendienteConMedico) {
        return {
            valido: false,
            status: 409,
            mensaje: 'El paciente ya tiene un turno pendiente con este médico. Debe asistir o cancelarlo antes de sacar otro.',
        };
    }

    const medico = await Medico.findById(datos.medico).session(session ?? null);

    if (!medico) {
        return { valido: false, status: 404, mensaje: 'Médico no encontrado' };
    }

    const fecha = new Date(datos.fechaTurno);
    const inicioDelDia = new Date(fecha);
    inicioDelDia.setUTCHours(0, 0, 0, 0);
    const finDelDia = new Date(fecha);
    finDelDia.setUTCHours(23, 59, 59, 999);

    const turnosDelDia = await Turno.countDocuments({
        medico: datos.medico,
        activo: true,
        fechaTurno: { $gte: inicioDelDia, $lte: finDelDia },
    }).session(session ?? null);

    if (turnosDelDia >= medico.cupoMaximo) {
        return {
            valido: false,
            status: 409,
            mensaje: `El médico alcanzó el cupo máximo de turnos para ese día (${medico.cupoMaximo})`,
        };
    }

    return { valido: true };
};
