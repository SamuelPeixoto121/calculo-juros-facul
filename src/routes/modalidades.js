import { Router } from 'express';

import { MODALIDADES, buscaModalidade } from '../dados/modalidades.js';
import { ErroDeNegocio } from '../lib/erros.js';

const router = Router();

// GET /api/modalidades — lista todas
router.get('/', (req, res) => {
  res.json({ total: MODALIDADES.length, itens: MODALIDADES });
});

// GET /api/modalidades/:codigo — uma só. ":codigo" é um parâmetro de rota: vem em req.params
router.get('/:codigo', (req, res) => {
  const modalidade = buscaModalidade(req.params.codigo);
  if (!modalidade) {
    throw new ErroDeNegocio(404, 'MODALIDADE_NAO_ENCONTRADA',
      `Modalidade "${req.params.codigo}" não existe`);
  }
  res.json(modalidade);
});

export default router;
