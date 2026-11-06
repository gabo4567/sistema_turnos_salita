import type { IMedico, IBloqueHorarioMedico } from '../medicos/types/Medico.interface';
import Turno from './Turno.model';
import { EstadoTurno } from './types/TurnoEstado.enum';

const DURACION_TURNO_MS = 30 * 60 * 1000;
// Margen de búsqueda: de sobra para cualquier horario real (como mucho el
// médico atiende un día cada 7), evita loopear para siempre si por algún
// motivo nunca se encuentra lugar.
const MAX_DIAS_A_BUSCAR = 60;

const formatearFecha = (fecha: Date): string => fecha.toISOString().slice(0, 10);

const formatearHoraART = (fecha: Date): string =>
    fecha.toLocaleTimeString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

// Construye un Date UTC a partir de una fecha "YYYY-MM-DD" y una hora
// "HH:MM" en horario de Argentina (UTC-3 fijo, sin horario de verano) —
// mismo supuesto que ya usa el resto del módulo (ver validarDisponibilidadTurno).
const construirFechaART = (fechaStr: string, horaStr: string): Date =>
    new Date(`${fechaStr}T${horaStr}:00.000-03:00`);

// "HH:MM" -> [horas, minutos]. Las horas vienen siempre con ese formato
// (validadas por HORA_REGEX en el schema del médico), nunca con menos de
// dos partes, pero TS no lo sabe a partir de un split() -- de ahí el "?? 0".
const partesHora = (hora: string): [number, number] => {
    const [horas, minutos] = hora.split(':');
    return [Number(horas ?? 0), Number(minutos ?? 0)];
};

const minutosDesdeMedianoche = (hora: string): number => {
    const [horas, minutos] = partesHora(hora);
    return horas * 60 + minutos;
};

// Todos los horarios de 30' de un bloque, ordenados por cercanía a
// `horaPreferida` (el horario original del turno) — para intentar
// reprogramar a la misma hora primero, y si no se puede, a la más próxima.
const horariosDelBloqueOrdenados = (bloque: IBloqueHorarioMedico, horaPreferida: string): string[] => {
    const horarios: string[] = [];
    let [horas, minutos] = partesHora(bloque.horaInicio);
    const [horasFin, minutosFin] = partesHora(bloque.horaFin);

    while (horas < horasFin || (horas === horasFin && minutos < minutosFin)) {
        horarios.push(`${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`);
        minutos += 30;
        if (minutos >= 60) {
            minutos -= 60;
            horas += 1;
        }
    }

    const objetivo = minutosDesdeMedianoche(horaPreferida);
    return horarios.sort(
        (a, b) => Math.abs(minutosDesdeMedianoche(a) - objetivo) - Math.abs(minutosDesdeMedianoche(b) - objetivo)
    );
};

// Próxima fecha "YYYY-MM-DD" (a partir de `offsetDias` días después de
// `fechaBase`) cuyo día de semana esté entre los horarios del médico. Solo
// mira si el médico atiende ese día, no si hay lugar — se usa para el
// resumen que se le muestra al médico antes de confirmar.
export const proximaFechaQueAtiende = (
    horarios: IBloqueHorarioMedico[],
    fechaBase: Date,
    offsetDias = 1
): string | null => {
    if (horarios.length === 0) return null;
    const diasConHorario = new Set(horarios.map((bloque) => bloque.diaSemana));

    for (let i = 0; i < MAX_DIAS_A_BUSCAR; i++) {
        const candidata = new Date(fechaBase.getTime() + (offsetDias + i) * 24 * 60 * 60 * 1000);
        if (diasConHorario.has(candidata.getUTCDay())) {
            return formatearFecha(candidata);
        }
    }

    return null;
};

// Busca dónde reprogramar un turno que su médico no va a poder atender:
// recorre los próximos días que el médico atiende (según sus horarios) y,
// en cada uno, intenta primero el mismo horario del turno original y si no
// está libre prueba el horario libre más cercano ese mismo día. Respeta el
// cupo máximo diario del médico, igual que al crear un turno nuevo. Si no
// encuentra lugar en ningún día dentro del margen de búsqueda, devuelve
// null (el turno se cancela en vez de reprogramarse, ver turnos.controller).
export const buscarProximoHorarioDisponible = async (
    medico: IMedico,
    fechaOriginal: Date,
    excluirTurnoId: string
): Promise<Date | null> => {
    const diasConHorario = new Set(medico.horarios.map((bloque) => bloque.diaSemana));
    if (diasConHorario.size === 0) return null;

    const horaPreferida = formatearHoraART(fechaOriginal);
    let cursor = new Date(fechaOriginal);

    for (let intento = 0; intento < MAX_DIAS_A_BUSCAR; intento++) {
        cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
        const diaSemana = cursor.getUTCDay();
        if (!diasConHorario.has(diaSemana)) continue;

        const fechaStr = formatearFecha(cursor);
        const bloque = medico.horarios.find((b) => b.diaSemana === diaSemana);
        if (!bloque) continue;

        const inicioDelDia = new Date(`${fechaStr}T00:00:00.000Z`);
        const finDelDia = new Date(`${fechaStr}T23:59:59.999Z`);

        const turnosDelDia = await Turno.countDocuments({
            medico: medico._id,
            activo: true,
            fechaTurno: { $gte: inicioDelDia, $lte: finDelDia },
        });
        if (turnosDelDia >= medico.cupoMaximo) continue;

        for (const horaCandidata of horariosDelBloqueOrdenados(bloque, horaPreferida)) {
            const fechaCandidata = construirFechaART(fechaStr, horaCandidata);
            const fechaFinCandidata = new Date(fechaCandidata.getTime() + DURACION_TURNO_MS);

            const ocupado = await Turno.findOne({
                _id: { $ne: excluirTurnoId },
                medico: medico._id,
                activo: true,
                estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.LLAMADO, EstadoTurno.ATENDIDO] },
                fechaTurno: { $lt: fechaFinCandidata },
                fechaFin: { $gt: fechaCandidata },
            });

            if (!ocupado) return fechaCandidata;
        }
    }

    return null;
};
