import { Router } from 'express';
import { getConsultorios, createConsultorio, updateConsultorio, deleteConsultorio } from './consultorios.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { CrearConsultorioSchema, ActualizarConsultorioSchema } from './dtos/consultorio.schema';

const router = Router();

router.get('/', getConsultorios);
router.post('/', validarSchema(CrearConsultorioSchema), createConsultorio);
router.put('/:id', validarSchema(ActualizarConsultorioSchema), updateConsultorio);
router.delete('/:id', deleteConsultorio);

export default router;
