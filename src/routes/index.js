import { Router } from 'express';

import jurosRoutes from './juros.js';

const router = Router();

// Registro central das rotas: para adicionar uma nova,
// crie o arquivo em ./routes e faça o router.use aqui.
router.use('/juros', jurosRoutes);

export default router;
