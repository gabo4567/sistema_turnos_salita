require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const app = express();

connectDB();

const auditMiddleware = require('./src/middlewares/auditoria.middleware');
const errorHandlerMiddleware = require('./src/middlewares/errorHandler.middleware');

const turnosRoutes = require('./src/routes/turnos.routes');
const pacientesRoutes = require('./src/routes/paciente.routes');
const recepcionRoutes = require('./src/routes/recepcion.routes');
const authRoutes = require('./src/routes/auth.routes');
const medicosRoutes = require('./src/routes/medico.routes');
const consultoriosRoutes = require('./src/routes/consultorio.routes');

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(auditMiddleware);

app.get('/', (req: any, res: any) => {
    res.send('Servidor de la Salita Municipal funcionando correctamente 🚀');
});

app.use('/api/v1/turnos', turnosRoutes);
app.use('/api/v1/pacientes', pacientesRoutes);
app.use('/api/v1/recepcion', recepcionRoutes);
app.use('/api/v1/medicos', medicosRoutes);
app.use('/api/v1/consultorios', consultoriosRoutes);
app.use('/api/auth', authRoutes);

app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`============SERVIDOR MUNICIPAL ACTIVO==========`);
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.ENTORNO || 'Local'} `);
    console.log(`===============================================`);
});
