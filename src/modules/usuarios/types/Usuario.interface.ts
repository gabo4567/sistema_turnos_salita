import { Document, Types } from 'mongoose';
import { RolUsuario } from './RolUsuario.enum';

export interface IUsuario extends Document {
    id?: Types.ObjectId;
    nombre: string;
    email: string;
    password: string;
    rol: RolUsuario;
    activo: boolean;
    resetTokenHash?: string;
    resetTokenExpira?: Date;
    compararPassword(password: string): Promise<boolean>;
}
