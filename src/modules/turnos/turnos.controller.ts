import type { Request, Response } from 'express';
import Turno from './Turno.model';
import Medico from '../medicos/Medico.model';
import type { CrearTurnoDTO, ActualizarTurnoDTO, IQueryUrgencia } from './dtos/turno.schema';
import { EstadoTurno } from './types/TurnoEstado.enum';
import type { Especialidad } from './types/TurnoEspecialidad.enum';
import { validarDisponibilidadTurno } from './validarDisponibilidadTurno';

import { respuestaEstandar } from '../../utils/respuestaEstandar';
import { esErrorDeValidacion, mensajesDeValidacion, obtenerMensajeError } from '../../utils/erroresMongo';

interface DatosNuevoTurno {
    paciente: string;
    especialidad: Especialidad;
    medico: string;
    consultorio?: string;
    fechaTurno: string;
    estado?: EstadoTurno;
    observaciones?: string;
}

const getTurnos = async (req: Request, res: Response) => {
    try {
        const turnos = await Turno.find({ activo: true }).populate('paciente').populate('medico').populate('consultorio');
        return respuestaEstandar(res, 200, true, 'Turnos obtenidos exitosamente', turnos);
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error interno del servidor', obtenerMensajeError(error));
    }
};

// Para el rol paciente: solo sus propios turnos. El filtro sale de
// req.usuario.id (el JWT verificado), nunca de un parámetro que mande el
// cliente, para que un paciente no pueda ver turnos ajenos cambiando algo
// en el pedido.
const getMisTurnos = async (req: Request, res: Response) => {
    try {
        const turnos = await Turno.find({ paciente: req.usuario!.id, activo: true })
            .populate('paciente')
            .populate('medico')
            .populate('consultorio')
            .sort({ fechaTurno: 1 });

        return respuestaEstandar(res, 200, true, 'Turnos obtenidos exitosamente', turnos);
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error interno del servidor', obtenerMensajeError(error));
    }
};

// Para el rol médico: su propia agenda, de solo lectura. El médico sale de
// req.usuario.id (vía el usuarioId vinculado), nunca de un parámetro, para
// que un médico no pueda ver la agenda de otro cambiando algo en el pedido.
const getMisTurnosMedico = async (req: Request, res: Response) => {
    try {
        const medico = await Medico.findOne({ usuarioId: req.usuario!.id, activo: true });

        if (!medico) {
            return respuestaEstandar(res, 404, false, 'No se encontró un médico vinculado a esta cuenta');
        }

        const turnos = await Turno.find({ medico: medico._id, activo: true })
            .populate('paciente')
            .populate('consultorio')
            .sort({ fechaTurno: 1 });

        return respuestaEstandar(res, 200, true, 'Turnos obtenidos exitosamente', turnos);
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error interno del servidor', obtenerMensajeError(error));
    }
};

interface IQueryDisponibilidad {
    medico?: string;
    fecha?: string;
    // Al editar un turno existente, para que la grilla no muestre su propio
    // horario como "ocupado" (si no, no se podría guardar sin cambiarle la hora).
    excluirTurnoId?: string;
}

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Devuelve, para un médico y una fecha puntuales, qué horarios de 30' ya
// están ocupados (turnos 'pendiente' o 'atendido') — para pintar la grilla
// de disponibilidad del lado del cliente. El día se recorta como límites
// UTC del string "YYYY-MM-DD" recibido: funciona porque Argentina es
// UTC-3 fijo (sin horario de verano) y la franja horaria de atención
// (08:00 a 20:00 ART = 11:00 a 23:00 UTC) nunca cruza la medianoche UTC.
const getDisponibilidad = async (req: Request<unknown, unknown, unknown, IQueryDisponibilidad>, res: Response) => {
    try {
        const { medico, fecha, excluirTurnoId } = req.query;

        if (!medico || !fecha || !PATRON_FECHA.test(fecha)) {
            return respuestaEstandar(res, 400, false, 'Los parámetros medico y fecha (YYYY-MM-DD) son obligatorios');
        }

        const inicioDelDia = new Date(`${fecha}T00:00:00.000Z`);
        const finDelDia = new Date(`${fecha}T23:59:59.999Z`);

        const turnosDelDia = await Turno.find({
            ...(excluirTurnoId ? { _id: { $ne: excluirTurnoId } } : {}),
            medico,
            activo: true,
            estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.ATENDIDO] },
            fechaTurno: { $gte: inicioDelDia, $lte: finDelDia },
        });

        const ocupados = turnosDelDia.map((turno) =>
            turno.fechaTurno.toLocaleTimeString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            })
        );

        return respuestaEstandar(res, 200, true, 'Disponibilidad obtenida exitosamente', { ocupados });
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error al obtener la disponibilidad', obtenerMensajeError(error));
    }
};

const getTurnoPorId = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const turno = await Turno.findById(req.params.id).populate('paciente').populate('medico').populate('consultorio');

        if (!turno) {
            return respuestaEstandar(res, 404, false, 'Turno no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Turno obtenido exitosamente', turno);
    } catch (error: unknown) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', obtenerMensajeError(error));
    }
};

const createTurno = async (req: Request<unknown, unknown, CrearTurnoDTO, IQueryUrgencia>, res: Response) => {
    try {
        const origenPeticion = req.headers['x-origen'];
        console.log('🌎 Peticion realizada desde:', origenPeticion, '| usuario:', req.usuario?.email);

        const esPaciente = req.usuario?.rol === 'paciente';
        // Un paciente logueado solo puede sacarse turno a sí mismo (ignora
        // cualquier otro id de paciente que venga en el body), y nunca puede
        // marcar un turno como urgencia (eso es criterio clínico del staff).
        const esUrgente = !esPaciente && req.query.urgencia === 'true';

        const datosDelTurno: DatosNuevoTurno = {
            paciente: esPaciente ? req.usuario!.id : req.body.paciente,
            especialidad: req.body.especialidad,
            medico: req.body.medico,
            // '' (ningún consultorio elegido en el <select>) no es un ObjectId
            // válido para Mongo — se normaliza a "sin consultorio" (undefined).
            consultorio: req.body.consultorio || undefined,
            fechaTurno: req.body.fechaTurno,
        };

        if (esUrgente) {
            datosDelTurno.estado = EstadoTurno.ATENDIDO;
            datosDelTurno.observaciones = 'ingreso por guardia medica';
            console.log('🚨 ALERTA: registrado un turno de urgencia');
        }

        const resultado = await validarDisponibilidadTurno(
            { paciente: datosDelTurno.paciente, medico: datosDelTurno.medico, fechaTurno: datosDelTurno.fechaTurno },
            { omitirCupoYPendiente: esUrgente }
        );

        if (!resultado.valido) {
            return respuestaEstandar(res, resultado.status, false, resultado.mensaje);
        }

        const nuevoTurno = await Turno.create(datosDelTurno);
        return respuestaEstandar(res, 201, true, 'Turno creado exitosamente', nuevoTurno);
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        return respuestaEstandar(res, 500, false, 'Error interno del servidor', obtenerMensajeError(error));
    }
};

const updateTurno = async (req: Request<{ id: string }, unknown, ActualizarTurnoDTO>, res: Response) => {
    try {
        const { id } = req.params;

        if (req.body.medico || req.body.paciente || req.body.fechaTurno) {
            const turnoActual = await Turno.findById(id);

            if (!turnoActual) {
                return respuestaEstandar(res, 404, false, 'Turno no encontrado');
            }

            const fechaTurno = req.body.fechaTurno ?? turnoActual.fechaTurno;

            const resultado = await validarDisponibilidadTurno(
                {
                    paciente: req.body.paciente ?? turnoActual.paciente.toString(),
                    medico: req.body.medico ?? turnoActual.medico.toString(),
                    fechaTurno,
                },
                { omitirCupoYPendiente: true, excluirTurnoId: id }
            );

            if (!resultado.valido) {
                return respuestaEstandar(res, resultado.status, false, resultado.mensaje);
            }
        }

        const turnoActualizado = await Turno.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        }).populate('paciente').populate('medico').populate('consultorio');

        if (!turnoActualizado) {
            return respuestaEstandar(res, 404, false, 'Turno no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Turno actualizado exitosamente', turnoActualizado);
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }
        return respuestaEstandar(res, 400, false, 'Error al actualizar el turno', obtenerMensajeError(error));
    }
};

const marcarAtendido = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        const turnoActualizado = await Turno.findByIdAndUpdate(
            id,
            { estado: EstadoTurno.ATENDIDO },
            { new: true }
        ).populate('paciente').populate('medico').populate('consultorio');

        if (!turnoActualizado) {
            return respuestaEstandar(res, 404, false, 'Turno no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Turno marcado como atendido', turnoActualizado);
    } catch (error: unknown) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', obtenerMensajeError(error));
    }
};

const deleteTurno = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        if (req.usuario?.rol === 'paciente') {
            const turnoActual = await Turno.findById(id);

            if (!turnoActual) {
                return respuestaEstandar(res, 404, false, `Turno no encontrado con ID ${id}`);
            }

            if (turnoActual.paciente.toString() !== req.usuario.id) {
                return respuestaEstandar(res, 403, false, 'No podés cancelar un turno que no es tuyo');
            }
        }

        const turnoBorrado = await Turno.findByIdAndUpdate(
            id,
            { activo: false, estado: EstadoTurno.CANCELADO },
            { new: true }
        );

        if (!turnoBorrado) {
            return respuestaEstandar(res, 404, false, `Turno no encontrado con ID ${id}`);
        }

        return respuestaEstandar(res, 200, true, 'Turno eliminado exitosamente', turnoBorrado);
    } catch (error: unknown) {
        console.error('Error al eliminar el turno:', error);
        return respuestaEstandar(res, 400, false, 'ID con formato invalido', obtenerMensajeError(error));
    }
};

export { getTurnos, getMisTurnos, getMisTurnosMedico, getDisponibilidad, getTurnoPorId, createTurno, updateTurno, marcarAtendido, deleteTurno };
