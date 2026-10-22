import { Schema, model, Document } from 'mongoose';
import type { ITurno } from './types/Turno.interface';
import { Especialidad } from './types/TurnoEspecialidad.enum';
import { EstadoTurno } from './types/TurnoEstado.enum';

const turnoSchema = new Schema<ITurno>({
    paciente: {
        type: Schema.Types.ObjectId,
        ref: 'Paciente',
        required: [true, 'El ID del paciente es obligatorio'],
    },
    especialidad: {
        type: String,
        required: true,
        enum: {
            values: Object.values(Especialidad),
            message: '{VALUE} no es una especialidad válida',
        },
    },
    medico: {
        type: Schema.Types.ObjectId,
        ref: 'Medico',
        required: [true, 'El médico es obligatorio'],
    },
    consultorio: {
        type: Schema.Types.ObjectId,
        ref: 'Consultorio',
    },
    fechaTurno: {
        type: Date,
        required: [true, 'La fecha del turno es obligatoria'],
        validate: {
            validator: (value: Date) => value >= new Date(),
            message: 'La fecha del turno debe ser una fecha futura',
        },
    },
    // Se calcula sola a partir de fechaTurno (+30') si no viene explícita.
    // La usa verificarDisponibilidadTurno para el chequeo de solapamiento.
    fechaFin: {
        type: Date,
        required: [true, 'La fecha de fin es obligatoria'],
        default: function (this: { fechaTurno?: Date }) {
            return this.fechaTurno ? new Date(this.fechaTurno.getTime() + 30 * 60 * 1000) : undefined;
        },
    },
    estado: {
        type: String,
        enum: {
            values: Object.values(EstadoTurno),
            message: '{VALUE} no es un estado válido',
        },
        default: EstadoTurno.PENDIENTE,
    },
    observaciones: {
        type: String,
        maxlength: [500, 'Las observaciones no pueden superar los 500 caracteres'],
    },
    activo: {
        type: Boolean,
        default: true,
        select: false,
    },
}, {
    timestamps: true,
});

turnoSchema.set('toJSON', {
    // Cast local (no un parámetro tipado "any"): el tipo real que infiere
    // Mongoose para el documento no tiene índice de string, así que no
    // encaja con Record<string, unknown> como parámetro.
    transform: (_documento: Document, turnoRetorno) => {
        const objeto = turnoRetorno as unknown as Record<string, unknown>;
        objeto.id = objeto._id;
        delete objeto._id;
        delete objeto.__v;
    },
});

const TurnoModel = model<ITurno>('Turno', turnoSchema);

export default TurnoModel;
