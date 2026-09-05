const Medico = require('../models/Medico');
const respuestaEstandar = require('../utils/respuestaEstandar');

const getMedicos = async (req, res) => {
    try {
        const medicos = await Medico.find({ activo: true });
        return respuestaEstandar(res, 200, true, 'Médicos obtenidos exitosamente', medicos);
    } catch (error) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los médicos', error.message);
    }
};

const createMedico = async (req, res) => {
    try {
        const nuevoMedico = await Medico.create(req.body);
        return respuestaEstandar(res, 201, true, 'Médico creado exitosamente', nuevoMedico);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el médico', error.message);
    }
};

const updateMedico = async (req, res) => {
    try {
        const { id } = req.params;
        const medicoActualizado = await Medico.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!medicoActualizado) {
            return respuestaEstandar(res, 404, false, 'Médico no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Médico actualizado exitosamente', medicoActualizado);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        return respuestaEstandar(res, 400, false, 'Error al actualizar el médico', error.message);
    }
};

const deleteMedico = async (req, res) => {
    try {
        const { id } = req.params;
        const medicoBorrado = await Medico.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!medicoBorrado) {
            return respuestaEstandar(res, 404, false, 'Médico no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Médico eliminado exitosamente', medicoBorrado);
    } catch (error) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', error.message);
    }
};

module.exports = {
    getMedicos,
    createMedico,
    updateMedico,
    deleteMedico,
};
