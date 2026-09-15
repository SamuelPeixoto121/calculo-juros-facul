import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
	res.json({ status: 'ok', mensagem: 'API está ok' });
});

export default router;
