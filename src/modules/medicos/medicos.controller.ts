import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Medico from './Medico.model';
import Usuario from '../usuarios/Usuario.model';
import Turno from '../turnos/Turno.model';
import { RolUsuario } from '../usuarios/types/RolUsuario.enum';
import { EstadoTurno } from '../turnos/types/TurnoEstado.enum';
import type { CrearMedicoDTO, ActualizarMedicoDTO } from './dtos/medico.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';
import {
    esErrorDeValidacion,
    esErrorDeDuplicado,
    mensajesDeValidacion,
    campoDuplicado,
    obtenerMensajeError,
} from '../../utils/erroresMongo';

interface FiltrosMedicos {
    especialidad?: string;
    busqueda?: string;
}

const getMedicos = async (req: Request<unknown, unknown, unknown, FiltrosMedicos>, res: Response) => {
    try {
        const { especialidad, busqueda } = req.query;
        const filtro: Record<string, unknown> = { activo: true };

        if (especialidad) {
            filtro.especialidades = especialidad;
        }

        if (busqueda) {
            const regex = new RegExp(busqueda, 'i');
            filtro.$or = [{ nombre: regex }, { apellido: regex }, { matricula: regex }];
        }

        const medicos = await Medico.find(filtro);
        return respuestaEstandar(res, 200, true, 'Médicos obtenidos exitosamente', medicos);
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los médicos', obtenerMensajeError(error));
    }
};

const getMedicoPorId = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;
        const medico = await Medico.findOne({ _id: id, activo: true }).populate('usuarioId', 'email');

        if (!medico) {
            return respuestaEstandar(res, 404, false, 'Médico no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Médico obtenido exitosamente', medico);
    } catch (error: unknown) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', obtenerMensajeError(error));
    }
};

// Crea en una sola transacción la cuenta de acceso (Usuario, rol médico) y el
// registro de Médico que la referencia: si falla cualquiera de las dos, no
// queda ninguna a mitad de camino.
const createMedico = async (req: Request<unknown, unknown, CrearMedicoDTO>, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { nombre, apellido, especialidades, matricula, telefono, cupoMaximo, email, password } = req.body;

        const [nuevoUsuario] = await Usuario.create(
            [{ nombre: `${nombre} ${apellido}`, email, password, rol: RolUsuario.MEDICO }],
            { session }
        );

        if (!nuevoUsuario) {
            throw new Error('No se pudo crear la cuenta del médico');
        }

        const [nuevoMedico] = await Medico.create(
            [{ usuarioId: nuevoUsuario._id, nombre, apellido, especialidades, matricula, telefono, cupoMaximo }],
            { session }
        );

        if (!nuevoMedico) {
            throw new Error('No se pudo crear el médico');
        }

        await session.commitTransaction();
        session.endSession();

        return respuestaEstandar(res, 201, true, 'Médico creado exitosamente', nuevoMedico);
    } catch (error: unknown) {
        await session.abortTransaction();
        session.endSession();

        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        if (esErrorDeDuplicado(error)) {
            return respuestaEstandar(res, 409, false, `Ya existe un registro con ese ${campoDuplicado(error)}`);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el médico', obtenerMensajeError(error));
    }
};

// Admin puede editar cualquier campo; un médico logueado solo puede tocar su
// propio teléfono (lo valida el schema de la ruta, acá solo queda chequear
// que el registro que está editando sea el suyo).
const updateMedico = async (req: Request<{ id: string }, unknown, ActualizarMedicoDTO>, res: Response) => {
    try {
        const { id } = req.params;
        const medico = await Medico.findById(id);

        if (!medico) {
            return respuestaEstandar(res, 404, false, 'Médico no encontrado');
        }

        if (req.usuario?.rol === RolUsuario.MEDICO && medico.usuarioId.toString() !== req.usuario.id) {
            return respuestaEstandar(res, 403, false, 'Solo podés editar tu propio perfil');
        }

        Object.assign(medico, req.body);
        await medico.save();

        return respuestaEstandar(res, 200, true, 'Médico actualizado exitosamente', medico);
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        if (esErrorDeDuplicado(error)) {
            return respuestaEstandar(res, 409, false, `Ya existe un médico registrado con ese ${campoDuplicado(error)}`);
        }

        return respuestaEstandar(res, 400, false, 'Error al actualizar el médico', obtenerMensajeError(error));
    }
};

const deleteMedico = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        const turnoFuturoPendiente = await Turno.findOne({
            medico: id,
            activo: true,
            estado: EstadoTurno.PENDIENTE,
            fechaTurno: { $gte: new Date() },
        });

        if (turnoFuturoPendiente) {
            return respuestaEstandar(
                res,
                400,
                false,
                'No se puede dar de baja: el médico tiene turnos pendientes a futuro'
            );
        }

        const medicoBorrado = await Medico.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!medicoBorrado) {
            return respuestaEstandar(res, 404, false, 'Médico no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Médico eliminado exitosamente', medicoBorrado);
    } catch (error: unknown) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', obtenerMensajeError(error));
    }
};

export { getMedicos, getMedicoPorId, createMedico, updateMedico, deleteMedico };
