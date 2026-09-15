// Importe o módulo Router do Express para criar rotas na aplicação.
import { Router } from 'express';

// Crie uma instância do Router para definir as rotas.
const router = Router();

// Dentro do objeto router, temos as funções .get() .post() .put() .patch() .delete() 
// que correspondem aos métodos HTTP GET, POST, PUT, PATCH e DELETE, respectivamente.

// -> O primeiro parâmetro é a rota que será acessada, por exemplo: /exemplo
// -> O segundo parâmetro é uma função que será executada quando a rota for acessada.
// -> Essa função recebe dois parâmetros: req (request) e res (response).
// -> Dentro da função, podemos acessar os dados da requisição através do objeto req
// -> E podemos enviar uma resposta para o cliente através do objeto res.

// Exemplo de rota GET /exemplo que retorna um JSON com status e mensagem.
router.get('/exemplo', function (req, res) {
    res.json({ status: 'ok', mensagem: 'API está ok' });
});

// Exemplo de rota POST /outro que retorna um JSON com status e mensagem.
// Vamos utilizar arrow function para definir a função de callback.
//                                |
//                                v
router.post('/outro', (req, res) => {
    res.json({ status: 'ok', mensagem: 'POST recebido' });
});

// Exporta o objeto router para que ele possa ser utilizado em outros arquivos da aplicação.
export default router;