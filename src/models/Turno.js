const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema({
    paciente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: [true, 'El ID del paciente es obligatorio'],
    },
    especialidad: {
        type: String,
        required: true,
        enum: {
            values: ['cardiologia', 'neurologia', 'pediatria', 'dermatologia'],
            message: '{VALUE} no es una especialidad válida',
        },
    },
    fechaTurno: {
        type: Date,
        required: [true, 'La fecha del turno es obligatoria'],
        validate: {
            validator: function(value) {
                return value >= new Date();
            },
            message: 'La fecha del turno debe ser una fecha futura',
        },
    },
    estado: {
        type: String,
        enum: {
            values: ['pendiente', 'atendido', 'cancelado'],
            message: '{VALUE} no es un estado válido',
        },
    },
    observaciones: {
        type: String,
        maxlength: [500, 'Las observaciones no pueden superar los 500 caracteres'],
    },
    activo: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
        timestamps: true,
});

turnoSchema.set('toJSON', {
    transform: (documento, turnoRetorno) => {
        turnoRetorno.id = turnoRetorno._id;
        delete turnoRetorno._id;
        delete turnoRetorno.__v;
    }
});

module.exports = mongoose.model('Turno', turnoSchema);
