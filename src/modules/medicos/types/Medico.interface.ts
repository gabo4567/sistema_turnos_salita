import { Document, Types } from 'mongoose';
import { Especialidad } from '../../turnos/types/TurnoEspecialidad.enum';

export interface ITelefonoMedico {
    codigoArea: string;
    numero: string;
}

// 1=lunes...5=viernes (coincide con Date.getUTCDay()). La salita no abre
// sábados ni domingos. Un médico sin bloques cargados no puede recibir
// turnos todavía (ver validarHorarioMedico).
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
