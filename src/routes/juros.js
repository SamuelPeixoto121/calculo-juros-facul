import { Router } from 'express';

const router = Router();

router.post('/simples', (req, res) => {
	const { capital, taxa, periodos } = req.body ?? {};

	if (![capital, taxa, periodos].every((v) => typeof v === 'number' && Number.isFinite(v))) {
		return res
			.status(400)
			.json({ erro: 'Campos "capital", "taxa" e "periodos" devem ser números' });
	}

	const i = taxa / 100;
	const montante = capital * (1 + i * periodos);

	res.json({
		tipo: 'simples',
		capital,
		taxa,
		periodos,
		juros: Number((montante - capital).toFixed(2)),
		montante: Number(montante.toFixed(2)),
	});
});

router.post('/composto', (req, res) => {
	const { capital, taxa, periodos } = req.body ?? {};

	if (![capital, taxa, periodos].every((v) => typeof v === 'number' && Number.isFinite(v))) {
		return res
			.status(400)
			.json({ erro: 'Campos "capital", "taxa" e "periodos" devem ser números' });
	}

	const i = taxa / 100;
	const montante = capital * (1 + i) ** periodos;

	res.json({
		tipo: 'composto',
		capital,
		taxa,
		periodos,
		juros: Number((montante - capital).toFixed(2)),
		montante: Number(montante.toFixed(2)),
	});
});

export default router;
