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

// Filtro de estado compartido por los 3 listados de turnos. Los cancelados
// y los "no asistió" ya no se ocultan sin remedio (son historial, no datos
// borrados) — este filtro decide qué mostrar:
// - sin filtro / 'activos': todo lo que sigue "en curso" o terminó bien
//   (pendiente, llamado, atendido) — ni cancelados ni no-asistió, para no
//   ensuciar el día a día con excepciones.
// - 'todos': sin restricción, incluye todo.
// - un estado puntual: solo ese.
type FiltroEstado = EstadoTurno | 'activos' | 'todos';

const filtroPorEstado = (estado?: FiltroEstado): Record<string, unknown> => {
    if (!estado || estado === 'activos') {
        return { estado: { $nin: [EstadoTurno.CANCELADO, EstadoTurno.NO_ASISTIO] } };
    }
    if (estado === 'todos') return {};
    return { estado };
};

// Un turno 'pendiente' cuyo horario ya pasó sin que nadie lo haya llamado
// queda como "no se presentó"; uno 'llamado' cuyo horario ya pasó sin que
// nadie haya apretado "Finalizar consulta" se asume atendido (red de
// seguridad por si se olvidan de cerrarlo a mano). Se corre antes de
// devolver cualquier listado, en vez de con una tarea programada aparte —
// no hay infraestructura de cron en el proyecto, y así el dato se
// autocorrige solo la próxima vez que alguien mire sus turnos.
const actualizarTurnosVencidos = async (): Promise<void> => {
    const ahora = new Date();

    // Pasa también activo a false: un "no asistió" no tiene que seguir
    // contando como turno pendiente para el chequeo de "ya tenés un turno
    // con este médico" ni para el cupo diario — igual que un cancelado,
    // sigue visible como historial, pero deja de bloquear turnos nuevos.
    await Turno.updateMany(
        { estado: EstadoTurno.PENDIENTE, activo: true, fechaFin: { $lt: ahora } },
        { estado: EstadoTurno.NO_ASISTIO, activo: false }
    );
    await Turno.updateMany(
        { estado: EstadoTurno.LLAMADO, activo: true, fechaFin: { $lt: ahora } },
        { estado: EstadoTurno.ATENDIDO }
    );
};

// Si quien pide es médico, chequea que el turno sea suyo (comparando contra
// el Medico vinculado a su usuarioId) — nunca contra un id que mande el
// cliente. Admin y recepcionista no tienen esta restricción.
type ChequeoTurnoPropio = { ok: true } | { ok: false; status: number; mensaje: string };

const chequearTurnoPropioSiEsMedico = async (req: Request, id: string): Promise<ChequeoTurnoPropio> => {
    if (req.usuario?.rol !== 'medico') return { ok: true };

    const medico = await Medico.findOne({ usuarioId: req.usuario.id, activo: true });

    if (!medico) {
        return { ok: false, status: 404, mensaje: 'No se encontró un médico vinculado a esta cuenta' };
    }

    const turnoActual = await Turno.findById(id);

    if (!turnoActual) {
        return { ok: false, status: 404, mensaje: 'Turno no encontrado' };
    }

    if (turnoActual.medico.toString() !== medico._id.toString()) {
        return { ok: false, status: 403, mensaje: 'No podés modificar un turno que no es tuyo' };
    }

    return { ok: true };
};

interface IQueryListadoTurnos {
    estado?: FiltroEstado;
}

const getTurnos = async (req: Request<unknown, unknown, unknown, IQueryListadoTurnos>, res: Response) => {
    try {
        await actualizarTurnosVencidos();

        const turnos = await Turno.find(filtroPorEstado(req.query.estado))
            .populate('paciente')
            .populate('medico')
            .populate('consultorio');

        return respuestaEstandar(res, 200, true, 'Turnos obtenidos exitosamente', turnos);
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error interno del servidor', obtenerMensajeError(error));
    }
};

// Para el rol paciente: solo sus propios turnos. El filtro de dueño sale de
// req.usuario.id (el JWT verificado), nunca de un parámetro que mande el
// cliente, para que un paciente no pueda ver turnos ajenos cambiando algo
// en el pedido.
const getMisTurnos = async (req: Request<unknown, unknown, unknown, IQueryListadoTurnos>, res: Response) => {
    try {
        await actualizarTurnosVencidos();

        const turnos = await Turno.find({ paciente: req.usuario!.id, ...filtroPorEstado(req.query.estado) })
            .populate('paciente')
            .populate('medico')
            .populate('consultorio')
            .sort({ fechaTurno: 1 });

        return respuestaEstandar(res, 200, true, 'Turnos obtenidos exitosamente', turnos);
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error interno del servidor', obtenerMensajeError(error));
    }
};

interface IQueryMisTurnosMedico {
    estado?: FiltroEstado;
    periodo?: 'hoy' | 'semana' | 'mes' | '6meses';
}

// "Hoy" en hora de Argentina, como "YYYY-MM-DD" — sin esto, en un servidor
// corriendo en UTC (como Render) "hoy" podría quedar un día adelantado o
// atrasado según la hora del día.
const hoyEnArgentina = (): string =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

const restarDias = (fecha: string, dias: number): string => {
    const base = new Date(`${fecha}T12:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() - dias);
    return base.toISOString().slice(0, 10);
};

const DIAS_POR_PERIODO: Record<'semana' | 'mes' | '6meses', number> = {
    semana: 7,
    mes: 30,
    '6meses': 182,
};

// Rango de fechas para el filtro de período: siempre termina hoy y mira
// para atrás (útil para repasar historial de atendidos). "hoy" es un caso
// aparte, con el mismo día como desde y hasta. Reusa el mismo truco de
// límites UTC de verificarDisponibilidadTurno: funciona porque ningún
// turno cae fuera de 08:00-20:00 ART, que nunca cruza la medianoche UTC.
const rangoDeFechas = (periodo: IQueryMisTurnosMedico['periodo']): { $gte: Date; $lte: Date } | null => {
    if (!periodo) return null;

    const hoy = hoyEnArgentina();
    const desde = periodo === 'hoy' ? hoy : restarDias(hoy, DIAS_POR_PERIODO[periodo]);

    return { $gte: new Date(`${desde}T00:00:00.000Z`), $lte: new Date(`${hoy}T23:59:59.999Z`) };
};

// Para el rol médico: su propia agenda, de solo lectura. El médico sale de
// req.usuario.id (vía el usuarioId vinculado), nunca de un parámetro, para
// que un médico no pueda ver la agenda de otro cambiando algo en el pedido.
// Admite filtrar por estado y por período (mirando hacia atrás desde hoy,
// pensado para repasar historial; sin período, trae todo — incluidos los
// turnos pendientes a futuro).
const getMisTurnosMedico = async (req: Request<unknown, unknown, unknown, IQueryMisTurnosMedico>, res: Response) => {
    try {
        await actualizarTurnosVencidos();

        const medico = await Medico.findOne({ usuarioId: req.usuario!.id, activo: true });

        if (!medico) {
            return respuestaEstandar(res, 404, false, 'No se encontró un médico vinculado a esta cuenta');
        }

        const { estado, periodo } = req.query;
        const rangoFechas = rangoDeFechas(periodo);

        const turnos = await Turno.find({
            medico: medico._id,
            ...filtroPorEstado(estado),
            ...(rangoFechas ? { fechaTurno: rangoFechas } : {}),
        })
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
            estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.LLAMADO, EstadoTurno.ATENDIDO] },
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
            { omitirCupoYPendiente: esUrgente, esUrgente }
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

        const turnoActual = await Turno.findById(id);

        if (!turnoActual) {
            return respuestaEstandar(res, 404, false, 'Turno no encontrado');
        }

        if (turnoActual.estado === EstadoTurno.LLAMADO || turnoActual.estado === EstadoTurno.ATENDIDO) {
            return respuestaEstandar(res, 400, false, 'No se puede editar un turno que ya fue llamado o atendido');
        }

        if (req.body.medico || req.body.paciente || req.body.fechaTurno) {
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

// Llamar y finalizar quedan como dos pasos separados (antes "Llamar" dejaba
// el turno directo en 'atendido'): así se puede medir cuánto duró la
// consulta, y si al paciente lo llaman y no entra, no queda falseado como
// atendido. Las puede marcar admin/recepcionista (para cualquier turno) o
// el propio médico (solo los suyos) — contempla tanto al consultorio que
// tiene un asistente en recepción como al que no.
// No tiene sentido poder llamar a un paciente mucho antes de la hora de su
// turno (ej. llamarlo a la madrugada para un turno de las 8). Se permite
// desde 1 hora antes, para cubrir el caso de que el médico llegue temprano
// y no haya nadie más esperando.
const VENTANA_LLAMADO_MS = 60 * 60 * 1000;

const marcarLlamado = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;
        const chequeo = await chequearTurnoPropioSiEsMedico(req, id);

        if (!chequeo.ok) {
            return respuestaEstandar(res, chequeo.status, false, chequeo.mensaje);
        }

        const turnoActual = await Turno.findById(id);

        if (!turnoActual) {
            return respuestaEstandar(res, 404, false, 'Turno no encontrado');
        }

        const puedeLlamarDesde = new Date(turnoActual.fechaTurno.getTime() - VENTANA_LLAMADO_MS);

        if (new Date() < puedeLlamarDesde) {
            const horaTurno = turnoActual.fechaTurno.toLocaleTimeString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });

            return respuestaEstandar(
                res,
                400,
                false,
                `Todavía no se puede llamar a este paciente: el turno es a las ${horaTurno}hs, recién se puede llamar desde 1 hora antes`
            );
        }

        const turnoActualizado = await Turno.findByIdAndUpdate(
            id,
            { estado: EstadoTurno.LLAMADO },
            { new: true }
        ).populate('paciente').populate('medico').populate('consultorio');

        if (!turnoActualizado) {
            return respuestaEstandar(res, 404, false, 'Turno no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Turno marcado como llamado', turnoActualizado);
    } catch (error: unknown) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', obtenerMensajeError(error));
    }
};

const marcarFinalizado = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;
        const chequeo = await chequearTurnoPropioSiEsMedico(req, id);

        if (!chequeo.ok) {
            return respuestaEstandar(res, chequeo.status, false, chequeo.mensaje);
        }

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

const MOTIVO_AUSENCIA_MEDICO = 'Cancelado: el médico no pudo asistir';

const deleteTurno = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;
        const actualizacion: { activo: boolean; estado: EstadoTurno; observaciones?: string } = {
            activo: false,
            estado: EstadoTurno.CANCELADO,
        };

        if (req.usuario?.rol === 'paciente') {
            const turnoActual = await Turno.findById(id);

            if (!turnoActual) {
                return respuestaEstandar(res, 404, false, `Turno no encontrado con ID ${id}`);
            }

            if (turnoActual.paciente.toString() !== req.usuario.id) {
                return respuestaEstandar(res, 403, false, 'No podés cancelar un turno que no es tuyo');
            }
        }

        // Un médico solo puede cancelar sus propios turnos (no los de otro
        // médico), y queda asentado que la baja fue porque no pudo asistir
        // (distinto de que la cancele el propio paciente).
        if (req.usuario?.rol === 'medico') {
            const chequeo = await chequearTurnoPropioSiEsMedico(req, id);

            if (!chequeo.ok) {
                return respuestaEstandar(res, chequeo.status, false, chequeo.mensaje);
            }

            actualizacion.observaciones = MOTIVO_AUSENCIA_MEDICO;
        }

        const turnoBorrado = await Turno.findByIdAndUpdate(id, actualizacion, { new: true });

        if (!turnoBorrado) {
            return respuestaEstandar(res, 404, false, `Turno no encontrado con ID ${id}`);
        }

        return respuestaEstandar(res, 200, true, 'Turno eliminado exitosamente', turnoBorrado);
    } catch (error: unknown) {
        console.error('Error al eliminar el turno:', error);
        return respuestaEstandar(res, 400, false, 'ID con formato invalido', obtenerMensajeError(error));
    }
};

// El médico marca que no puede atender ninguno de sus turnos pendientes de
// HOY: los cancela todos de una, dejando asentado el motivo. No toca
// turnos de otros días (eso se cancela uno por uno, con deleteTurno).
const marcarAusenciaMedico = async (req: Request, res: Response) => {
    try {
        const medico = await Medico.findOne({ usuarioId: req.usuario!.id, activo: true });

        if (!medico) {
            return respuestaEstandar(res, 404, false, 'No se encontró un médico vinculado a esta cuenta');
        }

        const hoy = hoyEnArgentina();
        const inicioDelDia = new Date(`${hoy}T00:00:00.000Z`);
        const finDelDia = new Date(`${hoy}T23:59:59.999Z`);

        const resultado = await Turno.updateMany(
            {
                medico: medico._id,
                estado: EstadoTurno.PENDIENTE,
                fechaTurno: { $gte: inicioDelDia, $lte: finDelDia },
            },
            { activo: false, estado: EstadoTurno.CANCELADO, observaciones: MOTIVO_AUSENCIA_MEDICO }
        );

        return respuestaEstandar(
            res,
            200,
            true,
            `Se cancelaron ${resultado.modifiedCount} turno(s) de hoy`,
            { cancelados: resultado.modifiedCount }
        );
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error al marcar la ausencia', obtenerMensajeError(error));
    }
};

export {
    getTurnos,
    getMisTurnos,
    getMisTurnosMedico,
    getDisponibilidad,
    getTurnoPorId,
    createTurno,
    updateTurno,
    marcarLlamado,
    marcarFinalizado,
    deleteTurno,
    marcarAusenciaMedico,
};
