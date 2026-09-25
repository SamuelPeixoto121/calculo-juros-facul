import { Router } from 'express';

import healthRoutes from './health.js';
import jurosRoutes from './juros.js';
import modalidadesRoutes from './modalidades.js';

const router = Router();

// Registro central das rotas: para adicionar uma nova,
// crie o arquivo em ./routes e faça o router.use aqui.
router.use('/health', healthRoutes);
router.use('/juros', jurosRoutes);
router.use('/modalidades', modalidadesRoutes);

export default router;
