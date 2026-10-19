import { Schema, model } from 'mongoose';
import type { IMedico } from './types/Medico.interface';
import { Especialidad } from '../turnos/types/TurnoEspecialidad.enum';

const medicoSchema = new Schema<IMedico>({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
    },
    especialidad: {
        type: String,
        required: [true, 'La especialidad es obligatoria'],
        enum: {
            values: Object.values(Especialidad),
            message: '{VALUE} no es una especialidad válida',
        },
    },
    matricula: {
        type: String,
        required: [true, 'La matrícula es obligatoria'],
        unique: true,
    },
    telefono: {
        type: String,
    },
    cupoMaximo: {
        type: Number,
        default: 15,
        min: [1, 'El cupo máximo debe ser al menos 1'],
    },
    activo: {
        type: Boolean,
        default: true,
        select: false,
    },
}, {
    timestamps: true,
});

medicoSchema.set('toJSON', {
    transform: (_documento, medicoRetorno) => {
        const objeto = medicoRetorno as unknown as Record<string, unknown>;
        objeto.id = objeto._id;
        delete objeto._id;
        delete objeto.__v;
    },
});

const MedicoModel = model<IMedico>('Medico', medicoSchema);

export default MedicoModel;
