import { Router } from 'express';
import { login, obtenerPerfil, olvidePassword, restablecerPassword } from './auth.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { verificarToken } from '../../middlewares/verificarToken.middleware';
import { limitarReset } from '../../middlewares/limitarReset.middleware';
import { LoginSchema, OlvidePasswordSchema, RestablecerPasswordSchema } from './dtos/auth.schema';

const router = Router();

router.post('/login', validarSchema(LoginSchema), login);
router.get('/me', verificarToken, obtenerPerfil);
router.post('/olvide-password', limitarReset, validarSchema(OlvidePasswordSchema), olvidePassword);
router.post('/restablecer-password', validarSchema(RestablecerPasswordSchema), restablecerPassword);

export default router;
