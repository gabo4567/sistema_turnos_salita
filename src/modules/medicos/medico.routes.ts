import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { getMedicos, getMiPerfilMedico, getMedicoPorId, createMedico, updateMedico, deleteMedico } from './medicos.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { verificarRol } from '../../middlewares/verificarRol.middleware';
import { RolUsuario } from '../usuarios/types/RolUsuario.enum';
import { CrearMedicoSchema, ActualizarMedicoSchema, ActualizarTelefonoMedicoSchema } from './dtos/medico.schema';

const router = Router();

// Admin puede editar cualquier campo; un médico logueado solo el suyo y solo
// el teléfono, así que valida contra un schema más chico.
const validarActualizacionMedico = (req: Request, res: Response, next: NextFunction) => {
    const schema = req.usuario?.rol === RolUsuario.MEDICO ? ActualizarTelefonoMedicoSchema : ActualizarMedicoSchema;
    return validarSchema(schema)(req, res, next);
};

router.get('/', verificarToken, getMedicos);
router.get('/me', verificarToken, verificarRol(RolUsuario.MEDICO), getMiPerfilMedico);
router.get('/:id', verificarToken, getMedicoPorId);
router.post('/', verificarToken, verificarRol('admin'), validarSchema(CrearMedicoSchema), createMedico);
router.patch('/:id', verificarToken, verificarRol('admin', 'medico'), validarActualizacionMedico, updateMedico);
router.delete('/:id', verificarToken, verificarRol('admin'), deleteMedico);

export default router;
