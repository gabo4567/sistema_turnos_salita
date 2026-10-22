import { Document, Schema, model } from 'mongoose';
import type { IPaciente } from './types/Paciente.interface';
import { ObraSocial } from './types/PacienteObraSocial.enum';
import { TipoTelefono } from './types/PacienteTelefono.enum';

const pacienteSchema = new Schema<IPaciente>({
    nombre: {
        type: String,
        required: [true, 'El nombre del paciente es obligatorio'],
        uppercase: true,
    },
    dni: {
        type: String,
        required: [true, 'El DNI del paciente es obligatorio'],
        unique: [true, 'El DNI del paciente debe ser único'],
        match: [/^[0-9]{7,8}$/, 'El DNI debe tener 8 dígitos'],
    },
    direccion: {
        calle: {
            type: String,
            required: [true, 'La calle es obligatoria'],
        },
        numero: {
            type: String,
            required: [true, 'El número es obligatorio'],
        },
        piso: String,
        departamento: String,
        barrio: String,
    },
    email: {
        type: String,
        required: [true, 'El correo electrónico del paciente es obligatorio'],
        unique: [true, 'El correo electrónico del paciente debe ser único'],
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'El correo electrónico no es válido'],
    },
    telefono: {
        tipo: {
            type: String,
            enum: Object.values(TipoTelefono),
        },
        codigoArea: {
            type: String,
            required: true,
            match: [/^[0-9]{2,5}$/, 'El código de área no es válido'],
        },
        numero: {
            type: String,
            required: true,
            match: [/^[0-9]{7,10}$/, 'El número de teléfono no es válido'],
        },
    },
    obraSocial: {
        nombre: {
            type: String,
            required: [true, 'El nombre de la obra social es obligatorio'],
            enum: {
                values: Object.values(ObraSocial),
                message: '{VALUE} no es una obra social válida. Debe ser una de las siguientes: PAMI, OSPEL, OSDE, SANCOR, OSECAC, SWISS MEDICAL, GALENO, MEDICUS, OMINT, FEMEBA, OTRAS, NINGUNA',
            },
        },
        numeroAfiliado: String,
    },
    historialMedico: [{
        fecha: {
            type: Date,
            required: [true, 'La fecha del historial médico es obligatoria'],
            validate: {
                validator: (value: Date) => value <= new Date(),
                message: 'La fecha del historial médico no puede ser futura',
            },
        },
        diagnostico: {
            type: String,
            required: [true, 'El diagnóstico es obligatorio'],
        },
        tratamiento: {
            type: String,
            required: [true, 'El tratamiento es obligatorio'],
        },
        medico: {
            type: String,
            required: [true, 'El nombre del médico es obligatorio'],
        },
    }],
    activo: {
        type: Boolean,
        default: true,
        select: false,
    },
}, {
    timestamps: true,
});

pacienteSchema.set('toJSON', {
    transform: (_documento: Document, pacienteRetorno) => {
        const objeto = pacienteRetorno as unknown as Record<string, unknown>;
        objeto.id = objeto._id;
        delete objeto._id;
        delete objeto.__v;
    },
});

const PacienteModel = model<IPaciente>('Paciente', pacienteSchema);

export default PacienteModel;
