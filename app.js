require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/database');
const app = express();

connectDB();

const auditMiddleware = require('./src/middlewares/auditoria.middleware');
const errorHandlerMiddleware = require('./src/middlewares/errorHandler.middleware');

const turnosRoutes = require('./src/routes/turnos.routes');

app.use(express.json());
app.use(auditMiddleware);

app.use('/api/v1/turnos', turnosRoutes);

let pacientes = [
    {id: 1, nombre: 'Juan Perez', dni: '3388557744', edad: 45},
    {id: 2, nombre: 'Maria Garcia', dni: '3231231345', edad: 32},
]

app.get('/api/v1/pacientes', (req, res) => {
    res.status(200).json({
        total: pacientes.length,
        data: pacientes
    });
});

app.post('/api/v1/pacientes', (req, res) => {
    const { nombre, dni, edad } = req.body;

    if (!nombre || !dni || !edad) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const nuevoPaciente = {
        id: pacientes.length + 1,
        nombre,
        dni,
        edad
    };

    pacientes.push(nuevoPaciente);
    res.status(201).json({ message: 'Paciente creado exitosamente', data: nuevoPaciente });
});

app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`============SERVIDOR MUNICIPAL ACTIVO==========`);
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.ENTORNO || 'Local'} `);
    console.log(`===============================================`);
});
