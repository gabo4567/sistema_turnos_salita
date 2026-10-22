import { Document, Types } from 'mongoose';

export interface IConsultorio extends Document {
    id?: Types.ObjectId;
    numero: string;
    piso?: string;
    especialidad?: string;
    activo: boolean;
}
