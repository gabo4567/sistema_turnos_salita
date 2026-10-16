import { Router } from 'express';
import { getTurnos, getMisTurnos, getTurnoPorId, createTurno, updateTurno, marcarAtendido, deleteTurno } from './turnos.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { verificarRol } from '../../middlewares/verificarRol.middleware';
import { CrearTurnoSchema, ActualizarTurnoSchema } from './dtos/turno.schema';

const router = Router();

router.get('/', getTurnos);
router.get('/mis-turnos', verificarToken, verificarRol('paciente'), getMisTurnos);
router.get('/:id', getTurnoPorId);
router.post('/', verificarToken, validarSchema(CrearTurnoSchema), createTurno);
router.put('/:id', validarSchema(ActualizarTurnoSchema), updateTurno);
router.patch('/:id', marcarAtendido);
router.delete('/:id', deleteTurno);

export default router;
