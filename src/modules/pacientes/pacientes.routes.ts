import { Router } from 'express';
import { getPacientes, createPaciente, updatePaciente, deletePaciente } from './pacientes.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { CrearPacienteSchema, ActualizarPacienteSchema } from './dtos/paciente.schema';

const router = Router();

router.get('/', getPacientes);
router.post('/', validarSchema(CrearPacienteSchema), createPaciente);
router.put('/:id', validarSchema(ActualizarPacienteSchema), updatePaciente);
router.delete('/:id', deletePaciente);

export default router;
