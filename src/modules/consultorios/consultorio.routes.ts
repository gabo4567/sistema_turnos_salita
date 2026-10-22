import { Router } from 'express';
import { getConsultorios, createConsultorio, updateConsultorio, deleteConsultorio } from './consultorios.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { verificarRol } from '../../middlewares/verificarRol.middleware';
import { CrearConsultorioSchema, ActualizarConsultorioSchema } from './dtos/consultorio.schema';

const router = Router();

router.get('/', verificarToken, getConsultorios);
router.post('/', verificarToken, verificarRol('admin', 'recepcionista'), validarSchema(CrearConsultorioSchema), createConsultorio);
router.put('/:id', verificarToken, verificarRol('admin', 'recepcionista'), validarSchema(ActualizarConsultorioSchema), updateConsultorio);
router.delete('/:id', verificarToken, verificarRol('admin', 'recepcionista'), deleteConsultorio);

export default router;
