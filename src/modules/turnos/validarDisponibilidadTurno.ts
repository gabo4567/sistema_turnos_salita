import type { ClientSession } from 'mongoose';
import Turno from './Turno.model';
import Medico from '../medicos/Medico.model';
import type { IBloqueHorarioMedico } from '../medicos/types/Medico.interface';
import { HORA_APERTURA_SALITA, HORA_CIERRE_SALITA } from '../medicos/dtos/medico.schema';
import { EstadoTurno } from './types/TurnoEstado.enum';
import { verificarDisponibilidadTurno } from './verificarDisponibilidadTurno';

const DURACION_TURNO_MS = 30 * 60 * 1000;

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
    // La guardia atiende todos los días -- a diferencia de omitirCupoYPendiente,
    // esto no se activa en ningún otro caso (ni altas de recepción, ni ediciones).
    esUrgente?: boolean;
}

type ResultadoValidacion = { valido: true } | { valido: false; status: number; mensaje: string };

// Un médico sin `horarios` cargados se trata como "lunes a viernes, horario
// completo de la salita" (el comportamiento de siempre, para no romper la
// agenda de médicos que ya tienen turnos mientras nadie carga su horario
// real todavía). Con horarios cargados, solo se puede sacar turno el día y
// en el rango que el médico efectivamente atiende.
// fechaTurno siempre cae entre las 08:00 y las 20:00 ART (11:00-23:00 UTC),
// nunca cruza la medianoche UTC, así que getUTCDay() ya da el día de la
// semana correcto en Argentina sin tener que convertir el huso horario.
const validarHorarioMedico = (horarios: IBloqueHorarioMedico[], fechaDeseada: Date): ResultadoValidacion => {
    const diaSemana = fechaDeseada.getUTCDay();
    const horaART = fechaDeseada.toLocaleTimeString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    if (horarios.length === 0) {
        if (diaSemana === 0 || diaSemana === 6) {
            return { valido: false, status: 400, mensaje: 'El médico no atiende ese día' };
        }

        if (horaART < HORA_APERTURA_SALITA || horaART >= HORA_CIERRE_SALITA) {
            return { valido: false, status: 400, mensaje: `La salita atiende de ${HORA_APERTURA_SALITA} a ${HORA_CIERRE_SALITA}` };
        }

        return { valido: true };
    }

    const bloque = horarios.find((b) => b.diaSemana === diaSemana);

    if (!bloque) {
        return { valido: false, status: 400, mensaje: 'El médico no atiende ese día' };
    }

    if (horaART < bloque.horaInicio || horaART >= bloque.horaFin) {
        return {
            valido: false,
            status: 400,
            mensaje: `El médico atiende ese día de ${bloque.horaInicio} a ${bloque.horaFin}`,
        };
    }

    return { valido: true };
};

// Chequeos de disponibilidad compartidos entre createTurno (Nuevo Turno) y
// registrarIngreso (Nueva Recepción), para que las dos vías de alta de
// turnos respeten las mismas reglas: horario de atención del médico,
// horario ocupado (médico y paciente), turno pendiente duplicado, y cupo
// máximo diario del médico.
export const validarDisponibilidadTurno = async (
    datos: DatosTurno,
    opciones: OpcionesValidacion = {}
): Promise<ResultadoValidacion> => {
    const { session, omitirCupoYPendiente = false, excluirTurnoId, esUrgente = false } = opciones;
    const filtroExclusion = excluirTurnoId ? { _id: { $ne: excluirTurnoId } } : {};
    const fechaDeseada = new Date(datos.fechaTurno);

    // La guardia (urgencia) atiende todos los días, a cualquier hora: no se
    // busca al médico ni se chequea su horario configurado.
    let medico = null;

    if (!esUrgente) {
        medico = await Medico.findById(datos.medico).session(session ?? null);

        if (!medico) {
            return { valido: false, status: 404, mensaje: 'Médico no encontrado' };
        }

        const resultadoHorario = validarHorarioMedico(medico.horarios, fechaDeseada);

        if (!resultadoHorario.valido) {
            return resultadoHorario;
        }
    }

    // verificarDisponibilidadTurno (la función spec, medicoId + fechaDeseada
    // -> boolean) no tiene forma de excluirse a sí misma, así que solo se usa
    // tal cual al crear. Al editar un turno existente hace falta el mismo
    // chequeo de solapamiento pero ignorando el propio turno.
    const medicoDisponible = excluirTurnoId
        ? !(await Turno.findOne({
              _id: { $ne: excluirTurnoId },
              medico: datos.medico,
              activo: true,
              estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.LLAMADO, EstadoTurno.ATENDIDO] },
              fechaTurno: { $lt: new Date(fechaDeseada.getTime() + DURACION_TURNO_MS) },
              fechaFin: { $gt: fechaDeseada },
          }).session(session ?? null))
        : await verificarDisponibilidadTurno(datos.medico, fechaDeseada);

    if (!medicoDisponible) {
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

    // Se llega acá solo cuando omitirCupoYPendiente es false, lo que en la
    // práctica implica esUrgente false también (ver más arriba) — por lo
    // tanto `medico` ya se buscó. El chequeo queda igual por las dudas.
    if (!medico) {
        return { valido: false, status: 404, mensaje: 'Médico no encontrado' };
    }

    const inicioDelDia = new Date(fechaDeseada);
    inicioDelDia.setUTCHours(0, 0, 0, 0);
    const finDelDia = new Date(fechaDeseada);
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
