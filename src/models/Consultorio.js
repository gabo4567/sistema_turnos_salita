const mongoose = require('mongoose');

const consultorioSchema = new mongoose.Schema({
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
    transform: (documento, consultorioRetorno) => {
        consultorioRetorno.id = consultorioRetorno._id;
        delete consultorioRetorno._id;
        delete consultorioRetorno.__v;
    },
});

module.exports = mongoose.model('Consultorio', consultorioSchema);
