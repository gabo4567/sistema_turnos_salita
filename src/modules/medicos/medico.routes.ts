import { Router } from 'express';
import { getMedicos, createMedico, updateMedico, deleteMedico } from './medicos.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { verificarRol } from '../../middlewares/verificarRol.middleware';
import { CrearMedicoSchema, ActualizarMedicoSchema } from './dtos/medico.schema';

const router = Router();

router.get('/', verificarToken, getMedicos);
router.post('/', verificarToken, verificarRol('admin', 'recepcionista'), validarSchema(CrearMedicoSchema), createMedico);
router.put('/:id', verificarToken, verificarRol('admin', 'recepcionista'), validarSchema(ActualizarMedicoSchema), updateMedico);
router.delete('/:id', verificarToken, verificarRol('admin', 'recepcionista'), deleteMedico);

export default router;
