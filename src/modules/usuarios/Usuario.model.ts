import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import type { IUsuario } from './types/Usuario.interface';
import { RolUsuario } from './types/RolUsuario.enum';

const usuarioSchema = new Schema<IUsuario>({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'El email no es válido'],
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        select: false,
    },
    rol: {
        type: String,
        required: [true, 'El rol es obligatorio'],
        enum: {
            values: Object.values(RolUsuario),
            message: '{VALUE} no es un rol válido',
        },
    },
    activo: {
        type: Boolean,
        default: true,
        select: false,
    },
    // Recuperación de contraseña: solo se guarda el hash del token (nunca el
    // token en texto plano), de un solo uso y con expiración corta.
    resetTokenHash: {
        type: String,
        select: false,
    },
    resetTokenExpira: {
        type: Date,
        select: false,
    },
}, {
    timestamps: true,
});

// Hashea la contraseña una sola vez, antes de guardarla — nunca se guarda en texto plano.
// Esta versión de Mongoose usa hooks "pre" async/await (sin next()): alcanza con no llamar a next,
// simplemente terminar la función (o devolver una Promise) para que siga el guardado.
usuarioSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 10);
});

usuarioSchema.methods.compararPassword = function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

usuarioSchema.set('toJSON', {
    transform: (_documento, usuarioRetorno) => {
        const objeto = usuarioRetorno as unknown as Record<string, unknown>;
        objeto.id = objeto._id;
        delete objeto._id;
        delete objeto.__v;
        delete objeto.password;
    },
});

const UsuarioModel = model<IUsuario>('Usuario', usuarioSchema);

export default UsuarioModel;
