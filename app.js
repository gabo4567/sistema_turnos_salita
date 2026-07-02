const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

let turnos = [
    {id: 1, paciente: 'juan perez', dni: '3388557744', especialidad: 'cardiologia'},
    {id: 2, paciente: 'pedro perez', dni: '34234234234', especialidad: 'cardiologia'},
    {id: 3, paciente: 'maria Garcia', dni: '3231231345', especialidad: 'cardiologia'},
    {id: 4, paciente: 'luis Rodriguez', dni: '33812312744', especialidad: 'cardiologia'},
]

app.get('/api/v1/turnos', (req, res) => {
    res.status(200).json({
        total: turnos.length,
        data: turnos
    });
});

app.post('/api/v1/turnos', (req, res) => {
    const { paciente, dni, especialidad } = req.body;

    if (!paciente || !dni || !especialidad) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const nuevoTurno = {
        id: turnos.length + 1,
        paciente,
        dni,
        especialidad
    };

    turnos.push(nuevoTurno);
    res.status(201).json({ message: 'Turno creado exitosamente', data: nuevoTurno });
});

app.delete('/api/v1/turnos/:id', (req, res) => {
    const { id } = req.params;
    const turnoExiste = turnos.some(t => t.id === parseInt(id));

    if (!turnoExiste) {
        return res.status(404).json({ error: 'Turno no encontrado' });
    }

    turnos = turnos.filter(t => t.id !== parseInt(id));
    res.status(200).json({ message: 'Turno eliminado exitosamente', data: turnos });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
