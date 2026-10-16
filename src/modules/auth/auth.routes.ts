import { Router } from 'express';
import { login, obtenerPerfil } from './auth.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { LoginSchema } from './dtos/auth.schema';

const router = Router();

router.post('/login', validarSchema(LoginSchema), login);
router.get('/me', verificarToken, obtenerPerfil);

export default router;
