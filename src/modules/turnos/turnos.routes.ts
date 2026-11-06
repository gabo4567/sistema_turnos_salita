import { Router } from 'express';
import { getTurnos, getMisTurnos, getMisTurnosMedico, getDisponibilidad, getTurnoPorId, createTurno, updateTurno, marcarLlamado, marcarFinalizado, deleteTurno, marcarAusenciaMedico, obtenerResumenAusenciaMedico } from './turnos.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { verificarRol } from '../../middlewares/verificarRol.middleware';
import { CrearTurnoSchema, ActualizarTurnoSchema, ListarTurnosSchema, ListarMisTurnosMedicoSchema } from './dtos/turno.schema';

const router = Router();

router.get('/', verificarToken, verificarRol('admin', 'recepcionista'), validarSchema(ListarTurnosSchema), getTurnos);
router.get('/mis-turnos', verificarToken, verificarRol('paciente'), getMisTurnos);
router.get('/mis-turnos-medico', verificarToken, verificarRol('medico'), validarSchema(ListarMisTurnosMedicoSchema), getMisTurnosMedico);
router.get('/disponibilidad', verificarToken, getDisponibilidad);
router.get('/:id', verificarToken, getTurnoPorId);
router.post('/', verificarToken, validarSchema(CrearTurnoSchema), createTurno);
router.put('/:id', verificarToken, verificarRol('admin', 'recepcionista'), validarSchema(ActualizarTurnoSchema), updateTurno);
router.get('/ausencia-medico/resumen', verificarToken, verificarRol('medico'), obtenerResumenAusenciaMedico);
router.patch('/ausencia-medico', verificarToken, verificarRol('medico'), marcarAusenciaMedico);
router.patch('/:id/llamar', verificarToken, verificarRol('admin', 'recepcionista', 'medico'), marcarLlamado);
router.patch('/:id/finalizar', verificarToken, verificarRol('admin', 'recepcionista', 'medico'), marcarFinalizado);
router.delete('/:id', verificarToken, deleteTurno);

export default router;
