import express from 'express';

import rotas from './routes/index.js';

const app = express();

// Middlewares globais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Todas as rotas da aplicação ficam sob /api
app.use('/api', rotas);

export default app;
