import { Router } from 'express';
import { getPacientes, getPacientePorId, createPaciente, updatePaciente, deletePaciente } from './pacientes.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { verificarRol } from '../../middlewares/verificarRol.middleware';
import { CrearPacienteSchema, ActualizarPacienteSchema } from './dtos/paciente.schema';

const router = Router();

router.use(verificarToken, verificarRol('admin', 'recepcionista'));

router.get('/', getPacientes);
router.get('/:id', getPacientePorId);
router.post('/', validarSchema(CrearPacienteSchema), createPaciente);
router.put('/:id', validarSchema(ActualizarPacienteSchema), updatePaciente);
router.delete('/:id', deletePaciente);

export default router;
