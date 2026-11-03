import { Document, Types } from 'mongoose';
import { Especialidad } from '../../turnos/types/TurnoEspecialidad.enum';

export interface ITelefonoMedico {
    codigoArea: string;
    numero: string;
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
    activo: boolean;
}
