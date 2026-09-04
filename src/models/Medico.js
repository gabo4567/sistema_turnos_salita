const mongoose = require('mongoose');

const medicoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
    },
    especialidad: {
        type: String,
        required: [true, 'La especialidad es obligatoria'],
        enum: {
            values: ['cardiologia', 'neurologia', 'pediatria', 'dermatologia'],
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
    activo: {
        type: Boolean,
        default: true,
        select: false,
    },
}, {
    timestamps: true,
});

medicoSchema.set('toJSON', {
    transform: (documento, medicoRetorno) => {
        medicoRetorno.id = medicoRetorno._id;
        delete medicoRetorno._id;
        delete medicoRetorno.__v;
    },
});

module.exports = mongoose.model('Medico', medicoSchema);
