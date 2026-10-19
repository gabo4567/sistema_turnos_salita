import { Router } from 'express';
import { getTurnos, getMisTurnos, getMisTurnosMedico, getTurnoPorId, createTurno, updateTurno, marcarAtendido, deleteTurno } from './turnos.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { verificarRol } from '../../middlewares/verificarRol.middleware';
import { CrearTurnoSchema, ActualizarTurnoSchema } from './dtos/turno.schema';

const router = Router();

router.get('/', verificarToken, verificarRol('admin', 'recepcionista'), getTurnos);
router.get('/mis-turnos', verificarToken, verificarRol('paciente'), getMisTurnos);
router.get('/mis-turnos-medico', verificarToken, verificarRol('medico'), getMisTurnosMedico);
router.get('/:id', verificarToken, getTurnoPorId);
router.post('/', verificarToken, validarSchema(CrearTurnoSchema), createTurno);
router.put('/:id', verificarToken, verificarRol('admin', 'recepcionista'), validarSchema(ActualizarTurnoSchema), updateTurno);
router.patch('/:id', verificarToken, verificarRol('admin', 'recepcionista'), marcarAtendido);
router.delete('/:id', verificarToken, deleteTurno);

export default router;
