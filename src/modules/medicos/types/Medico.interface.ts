import { Document, Types } from 'mongoose';
import { Especialidad } from '../../turnos/types/TurnoEspecialidad.enum';

export interface ITelefonoMedico {
    codigoArea: string;
    numero: string;
}

// 1=lunes...6=sábado (coincide con Date.getUTCDay()). Un médico sin bloques
// cargados se trata como "lunes a viernes, horario completo de la salita".
export interface IBloqueHorarioMedico {
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
}

export interface IMedico extends Document {
    id?: Types.ObjectId;
    usuarioId: Types.ObjectId;
    nombre: string;
    apellido: string;
    especialidades: Especialidad[];
    matricula: string;
    telefono?: ITelefonoMedico;
    cupoMaximo: number;
    horarios: IBloqueHorarioMedico[];
    activo: boolean;
}
