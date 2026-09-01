import app from './src/app.js';

const PORT = 3000;

const server = app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});

// Encerramento gracioso (Ctrl+C / kill)
for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    console.log(`\n${sinal} recebido, encerrando servidor...`);
    server.close(() => process.exit(0));
  });
}
