import { Router } from 'express';
import { getTurnos, getTurnoPorId, createTurno, updateTurno, marcarAtendido, deleteTurno } from './turnos.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { CrearTurnoSchema, ActualizarTurnoSchema } from './dtos/turno.schema';

const router = Router();

router.get('/', getTurnos);
router.get('/:id', getTurnoPorId);
router.post('/', verificarToken, validarSchema(CrearTurnoSchema), createTurno);
router.put('/:id', validarSchema(ActualizarTurnoSchema), updateTurno);
router.patch('/:id', marcarAtendido);
router.delete('/:id', deleteTurno);

export default router;
