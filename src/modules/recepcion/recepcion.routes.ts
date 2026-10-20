import { Router } from 'express';
import { registrarIngreso } from './recepcion.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { verificarRol } from '../../middlewares/verificarRol.middleware';
import { RegistrarIngresoSchema } from './dtos/recepcion.schema';

const router = Router();

router.use(verificarToken, verificarRol('admin', 'recepcionista'));

router.post('/', validarSchema(RegistrarIngresoSchema), registrarIngreso);

export default router;
