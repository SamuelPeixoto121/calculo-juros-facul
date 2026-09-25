// Arredonda para 2 casas decimais (centavos).
// O Number.EPSILON corrige casos como 1.005 que em ponto flutuante viram 1.00499999.
export function arredonda2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}
