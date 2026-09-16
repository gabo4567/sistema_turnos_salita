import { Router } from 'express';
import { registrarIngreso } from './recepcion.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { RegistrarIngresoSchema } from './dtos/recepcion.schema';

const router = Router();

router.post('/', validarSchema(RegistrarIngresoSchema), registrarIngreso);

export default router;
