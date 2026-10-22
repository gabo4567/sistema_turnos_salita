import { Router } from 'express';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from './usuarios.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { verificarRol } from '../../middlewares/verificarRol.middleware';
import { CrearUsuarioSchema, ActualizarUsuarioSchema } from './dtos/usuario.schema';
import { RolUsuario } from './types/RolUsuario.enum';

const router = Router();

// Gestión de personal: exclusiva del rol admin.
router.use(verificarToken, verificarRol(RolUsuario.ADMIN));

router.get('/', getUsuarios);
router.post('/', validarSchema(CrearUsuarioSchema), createUsuario);
router.put('/:id', validarSchema(ActualizarUsuarioSchema), updateUsuario);
router.delete('/:id', deleteUsuario);

export default router;
