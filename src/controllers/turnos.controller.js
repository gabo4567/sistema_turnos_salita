const Turno = require('../models/Turno');

const respuestaEstandar = (res, status, success, message, data = null) => {
    return res.status(status).json({
        success,
        timestamp: new Date().toISOString(),
        message,
        total: Array.isArray(data) ? data.length : data ? 1 : 0,
        data
    });
};


const getTurnos = async (req, res) => {
    try {
        const turnos = await Turno.find();

         return respuestaEstandar(res, 200, true, 'Turnos obtenidos exitosamente', turnos);
    } catch (error) {
         return respuestaEstandar(res, 500, false, 'Error interno del servidor', error.message);
    }
};

const createTurno = async (req, res) => {
    try {

        const nuevoTurno = await Turno.create(req.body);
        return respuestaEstandar(res, 201, true, 'Turno creado exitosamente', nuevoTurno);

    } catch (error) {

        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
    }

    return respuestaEstandar(res, 500, false, 'Error interno del servidor', error.message);
  };
};

const deleteTurno = async (req, res) => {
    try {

        const { id } = req.params;
        const turno = await Turno.findByIdAndDelete(id);

        if (!turno) {
            return respuestaEstandar(res, 404, false, 'Turno no encontrado con ID ${id}');
        }

        return respuestaEstandar(res, 200, true, 'Turno eliminado exitosamente', turno);
    } catch (error) {
        return respuestaEstandar(res, 400, false, 'ID con formato invalido', error.message);
    }
};

module.exports = { getTurnos, createTurno, deleteTurno };
