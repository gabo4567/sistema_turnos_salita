import type { Application } from 'express';

import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express from 'express';
import { connectDB } from './src/config/database';

import auditMiddleware from './src/middlewares/auditoria.middleware';
import { rutaNoEncontrada, manejadorErrores } from './src/middlewares/errorHandler.middleware';

import turnosRoutes from './src/modules/turnos/turnos.routes';
import pacientesRoutes from './src/modules/pacientes/pacientes.routes';
import recepcionRoutes from './src/modules/recepcion/recepcion.routes';
import authRoutes from './src/modules/auth/auth.routes';
import medicosRoutes from './src/modules/medicos/medico.routes';
import consultoriosRoutes from './src/modules/consultorios/consultorio.routes';
import iaRoutes from './src/modules/ia/ia.routes';
import usuariosRoutes from './src/modules/usuarios/usuarios.routes';

const app: Application = express();

connectDB();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(auditMiddleware);

app.get('/', (req, res) => {
    res.send('Servidor de la Salita Municipal funcionando correctamente 🚀');
});

app.use('/api/v1/turnos', turnosRoutes);
app.use('/api/v1/pacientes', pacientesRoutes);
app.use('/api/v1/recepcion', recepcionRoutes);
app.use('/api/v1/medicos', medicosRoutes);
app.use('/api/v1/consultorios', consultoriosRoutes);
app.use('/api/v1/ia', iaRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/auth', authRoutes);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

const PORT: string | number = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`============SERVIDOR MUNICIPAL ACTIVO==========`);
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.ENTORNO || 'Local'} `);
    console.log(`===============================================`);
});
