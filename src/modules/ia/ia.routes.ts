import { Router } from 'express';
import { analizarHistorial } from './ia.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { AnalizarHistorialSchema } from './dtos/analisisClinico.schema';

const router = Router();

router.post('/analisis-clinico', verificarToken, validarSchema(AnalizarHistorialSchema), analizarHistorial);

export default router;
