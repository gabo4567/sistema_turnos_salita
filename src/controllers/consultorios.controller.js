const Consultorio = require('../models/Consultorio');
const respuestaEstandar = require('../utils/respuestaEstandar');

const getConsultorios = async (req, res) => {
    try {
        const consultorios = await Consultorio.find({ activo: true });
        return respuestaEstandar(res, 200, true, 'Consultorios obtenidos exitosamente', consultorios);
    } catch (error) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los consultorios', error.message);
    }
};

const createConsultorio = async (req, res) => {
    try {
        const nuevoConsultorio = await Consultorio.create(req.body);
        return respuestaEstandar(res, 201, true, 'Consultorio creado exitosamente', nuevoConsultorio);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el consultorio', error.message);
    }
};

const updateConsultorio = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorioActualizado = await Consultorio.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!consultorioActualizado) {
            return respuestaEstandar(res, 404, false, 'Consultorio no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Consultorio actualizado exitosamente', consultorioActualizado);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        return respuestaEstandar(res, 400, false, 'Error al actualizar el consultorio', error.message);
    }
};

const deleteConsultorio = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorioBorrado = await Consultorio.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!consultorioBorrado) {
            return respuestaEstandar(res, 404, false, 'Consultorio no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Consultorio eliminado exitosamente', consultorioBorrado);
    } catch (error) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', error.message);
    }
};

module.exports = {
    getConsultorios,
    createConsultorio,
    updateConsultorio,
    deleteConsultorio,
};
