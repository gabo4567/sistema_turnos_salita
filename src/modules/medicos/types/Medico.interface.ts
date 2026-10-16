import { Document, Types } from 'mongoose';
import { Especialidad } from '../../turnos/types/TurnoEspecialidad.enum';

export interface IMedico extends Document {
    id?: Types.ObjectId;
    nombre: string;
    especialidad: Especialidad;
    matricula: string;
    telefono?: string;
    cupoMaximo: number;
    activo: boolean;
}
