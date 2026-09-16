import { Router } from 'express';
import { login } from './auth.controller';
import { validarSchema } from '../../middlewares/validarDatos.middleware';
import { LoginSchema } from './dtos/auth.schema';

const router = Router();

router.post('/login', validarSchema(LoginSchema), login);

export default router;
