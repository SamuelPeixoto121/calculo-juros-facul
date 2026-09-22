// Erro "esperado" da regra de negócio: sabe qual status HTTP e qual código devolver.
// Qualquer outro erro (bug, banco fora) vira 500 no tratador de erros do app.js.
export class ErroDeNegocio extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.status = status; // ex.: 404, 400, 422
    this.codigo = codigo; // ex.: 'MODALIDADE_NAO_ENCONTRADA'
    this.detalhes = detalhes; // opcional: lista de strings
  }
}
