import type { Request, Response } from 'express';
import Usuario from './Usuario.model';
import { RolUsuario } from './types/RolUsuario.enum';
import type { CrearUsuarioDTO, ActualizarUsuarioDTO, OrdenUsuarios } from './dtos/usuario.schema';
import { respuestaEstandar } from '../../utils/respuestaEstandar';
import { resolverPaginacion, metaPaginacion, COLLATION_ES } from '../../utils/paginacion';
import {
    esErrorDeValidacion,
    esErrorDeDuplicado,
    mensajesDeValidacion,
    campoDuplicado,
    obtenerMensajeError,
} from '../../utils/erroresMongo';

interface FiltrosUsuarios {
    rol?: string;
    estado?: string;
    busqueda?: string;
    orden?: (typeof OrdenUsuarios)[number];
    pagina?: string;
    limite?: string;
}

const ORDEN_MONGO: Record<(typeof OrdenUsuarios)[number], Record<string, 1 | -1>> = {
    nombre_asc: { nombre: 1 },
    nombre_desc: { nombre: -1 },
    reciente: { createdAt: -1 },
    antiguo: { createdAt: 1 },
};

// La ruta ya es admin-only (ver usuarios.routes.ts), así que a diferencia de
// Pacientes/Médicos, 'estado' no depende del rol de quien pide: cualquier
// admin puede ver inactivos o todos.
const filtroPorEstadoUsuarios = (estado?: string): Record<string, boolean> => {
    if (estado === 'inactivos') return { activo: false };
    if (estado === 'todos') return {};
    return { activo: true };
};

const getUsuarios = async (req: Request<unknown, unknown, unknown, FiltrosUsuarios>, res: Response) => {
    try {
        const { rol, estado, busqueda, orden } = req.query;
        const filtro: Record<string, unknown> = filtroPorEstadoUsuarios(estado);

        if (rol) {
            filtro.rol = rol;
        }

        if (busqueda) {
            const regex = new RegExp(busqueda, 'i');
            filtro.$or = [{ nombre: regex }, { email: regex }];
        }

        const paginacion = resolverPaginacion(req.query);
        const totalRegistros = await Usuario.countDocuments(filtro);

        let consulta = Usuario.find(filtro)
            .select('+activo')
            .sort(ORDEN_MONGO[orden ?? 'nombre_asc'])
            .collation(COLLATION_ES)
            .skip(paginacion.skip);

        if (paginacion.limit !== undefined) {
            consulta = consulta.limit(paginacion.limit);
        }

        const usuarios = await consulta;

        return respuestaEstandar(
            res,
            200,
            true,
            'Usuarios obtenidos exitosamente',
            usuarios,
            metaPaginacion(paginacion, totalRegistros)
        );
    } catch (error: unknown) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los usuarios', obtenerMensajeError(error));
    }
};

const createUsuario = async (req: Request<unknown, unknown, CrearUsuarioDTO>, res: Response) => {
    try {
        const nuevoUsuario = await Usuario.create(req.body);
        return respuestaEstandar(res, 201, true, 'Usuario creado exitosamente', nuevoUsuario);
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        if (esErrorDeDuplicado(error)) {
            return respuestaEstandar(res, 409, false, `Ya existe un usuario registrado con ese ${campoDuplicado(error)}`);
        }

        return respuestaEstandar(res, 500, false, 'Error al crear el usuario', obtenerMensajeError(error));
    }
};

const updateUsuario = async (req: Request<{ id: string }, unknown, ActualizarUsuarioDTO>, res: Response) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findOne({ _id: id, activo: true }).select('+password');

        if (!usuario) {
            return respuestaEstandar(res, 404, false, 'Usuario no encontrado');
        }

        // Object.assign + save() (no findByIdAndUpdate) a propósito: así corre el
        // hook pre('save') que hashea la contraseña cuando viene en el body.
        Object.assign(usuario, req.body);
        await usuario.save();

        return respuestaEstandar(res, 200, true, 'Usuario actualizado exitosamente', usuario);
    } catch (error: unknown) {
        if (esErrorDeValidacion(error)) {
            return respuestaEstandar(res, 400, false, 'Error de validación', mensajesDeValidacion(error));
        }

        if (esErrorDeDuplicado(error)) {
            return respuestaEstandar(res, 409, false, `Ya existe un usuario registrado con ese ${campoDuplicado(error)}`);
        }

        return respuestaEstandar(res, 400, false, 'Error al actualizar el usuario', obtenerMensajeError(error));
    }
};

const deleteUsuario = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        if (req.usuario?.id === id) {
            return respuestaEstandar(res, 400, false, 'No podés dar de baja tu propia cuenta');
        }

        const usuarioABajar = await Usuario.findOne({ _id: id, activo: true });

        if (!usuarioABajar) {
            return respuestaEstandar(res, 404, false, 'Usuario no encontrado');
        }

        if (usuarioABajar.rol === RolUsuario.ADMIN) {
            const otrosAdminsActivos = await Usuario.countDocuments({
                _id: { $ne: id },
                rol: RolUsuario.ADMIN,
                activo: true,
            });

            if (otrosAdminsActivos === 0) {
                return respuestaEstandar(
                    res,
                    400,
                    false,
                    'No se puede dar de baja: quedaría el sistema sin administradores activos'
                );
            }
        }

        const usuarioBorrado = await Usuario.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!usuarioBorrado) {
            return respuestaEstandar(res, 404, false, 'Usuario no encontrado');
        }

        return respuestaEstandar(res, 200, true, 'Usuario eliminado exitosamente', usuarioBorrado);
    } catch (error: unknown) {
        return respuestaEstandar(res, 400, false, 'ID con formato inválido', obtenerMensajeError(error));
    }
};

export { getUsuarios, createUsuario, updateUsuario, deleteUsuario };
