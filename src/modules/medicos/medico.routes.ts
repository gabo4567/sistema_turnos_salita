import { Router } from 'express';
import { getMedicos, createMedico, updateMedico, deleteMedico } from './medicos.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { CrearMedicoSchema, ActualizarMedicoSchema } from './dtos/medico.schema';

const router = Router();

router.get('/', getMedicos);
router.post('/', validarSchema(CrearMedicoSchema), createMedico);
router.put('/:id', validarSchema(ActualizarMedicoSchema), updateMedico);
router.delete('/:id', deleteMedico);

export default router;
