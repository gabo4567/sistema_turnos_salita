import { Types, Document } from 'mongoose';
import { Especialidad } from './TurnoEspecialidad.enum';
import { EstadoTurno } from './TurnoEstado.enum';

export interface ITurno extends Document {
    id?: Types.ObjectId;
    paciente: Types.ObjectId;
    especialidad: Especialidad;
    medico: Types.ObjectId;
    consultorio?: Types.ObjectId;
    fechaTurno: Date;
    // Fin del bloque de 30 minutos del turno (fechaTurno + 30'). Se calcula
    // solo, pero queda persistido porque verificarDisponibilidadTurno
    // necesita comparar fecha/fechaFin de los turnos ya guardados.
    fechaFin: Date;
    estado?: EstadoTurno;
    observaciones?: string;
    activo: boolean;
}
