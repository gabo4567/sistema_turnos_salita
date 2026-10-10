import { Document, Types } from 'mongoose';

export interface IUsuario extends Document {
    id?: Types.ObjectId;
    nombre: string;
    email: string;
    password: string;
    activo: boolean;
    compararPassword(password: string): Promise<boolean>;
}
