import { Schema, model } from 'mongoose';
import type { IConsultorio } from './types/Consultorio.interface';

const consultorioSchema = new Schema<IConsultorio>({
    numero: {
        type: String,
        required: [true, 'El número de consultorio es obligatorio'],
        unique: true,
    },
    piso: {
        type: String,
    },
    especialidad: {
        type: String,
    },
    activo: {
        type: Boolean,
        default: true,
        select: false,
    },
}, {
    timestamps: true,
});

consultorioSchema.set('toJSON', {
    transform: (_documento, consultorioRetorno) => {
        const objeto = consultorioRetorno as unknown as Record<string, unknown>;
        objeto.id = objeto._id;
        delete objeto._id;
        delete objeto.__v;
    },
});

const ConsultorioModel = model<IConsultorio>('Consultorio', consultorioSchema);

export default ConsultorioModel;
