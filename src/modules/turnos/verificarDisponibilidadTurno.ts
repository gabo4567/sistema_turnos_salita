import Turno from './Turno.model';
import { EstadoTurno } from './types/TurnoEstado.enum';

const DURACION_TURNO_MS = 30 * 60 * 1000;

/**
 * Spec: Función verificarDisponibilidadTurno
 * Valida que un bloque de 30 minutos esté libre para un médico específico
 * antes de guardar.
 *
 * Entradas: medicoId (ObjectId válido), fechaDeseada (Date).
 * Lógica: calcula fechaFin = fechaDeseada + 30'. Un turno existente con
 * estado 'pendiente' o 'atendido' para ese médico se solapa si
 * (turno.fechaTurno < fechaFin) AND (turno.fechaFin > fechaDeseada).
 *
 * Devuelve true si está disponible (sin solapamiento), false si está ocupado.
 */
export async function verificarDisponibilidadTurno(medicoId: string, fechaDeseada: Date): Promise<boolean> {
    const fechaFin = new Date(fechaDeseada.getTime() + DURACION_TURNO_MS);

    const turnoSolapado = await Turno.findOne({
        medico: medicoId,
        activo: true,
        estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.ATENDIDO] },
        fechaTurno: { $lt: fechaFin },
        fechaFin: { $gt: fechaDeseada },
    });

    return !turnoSolapado;
}
