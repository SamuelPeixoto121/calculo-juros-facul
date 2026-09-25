import { arredonda2 } from './util.js';

export function calculaPrice({ valor, taxaMes, prazoMeses }) {
  // 1. Parcela fixa pela fórmula do PMT.
  const parcelaFixa = arredonda2((valor * taxaMes) / (1 - (1 + taxaMes) ** -prazoMeses));

  const parcelas = [];
  let saldo = valor;

  // 2/3. Percorre cada mês, decompondo a parcela em juros e amortização.
  for (let k = 1; k <= prazoMeses; k++) {
    const juros = arredonda2(saldo * taxaMes);

    // Na última parcela, a amortização é o saldo restante (zera a dívida exatamente).
    const amortizacao = k < prazoMeses ? arredonda2(parcelaFixa - juros) : saldo;

    const valorParcela = arredonda2(amortizacao + juros);
    saldo = arredonda2(saldo - amortizacao);

    parcelas.push({
      numero: k,
      amortizacao,
      juros,
      valor: valorParcela,
      saldoDevedor: saldo,
    });
  }

  // 4. Totais somados a partir dos valores já arredondados nas parcelas.
  const totalJuros = arredonda2(parcelas.reduce((soma, p) => soma + p.juros, 0));
  const totalPago = arredonda2(parcelas.reduce((soma, p) => soma + p.valor, 0));

  return {
    sistema: 'PRICE',
    parcelaFixa,
    parcelas,
    totalJuros,
    totalPago,
  };
}
