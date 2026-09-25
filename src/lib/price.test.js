import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculaPrice } from './price.js';

test('Price: 10.000 a 2% a.m. em 12 meses (cenário de referência)', () => {
  const r = calculaPrice({ valor: 10000, taxaMes: 0.02, prazoMeses: 12 });

  assert.equal(r.sistema, 'PRICE');
  assert.equal(r.parcelaFixa, 945.60);
  assert.equal(r.parcelas.length, 12);

  // 1ª parcela
  assert.equal(r.parcelas[0].juros, 200.00);
  assert.equal(r.parcelas[0].amortizacao, 745.60);
  assert.equal(r.parcelas[0].saldoDevedor, 9254.40);

  // última parcela zera o saldo e absorve os centavos
  assert.equal(r.parcelas[11].amortizacao, 927.01);
  assert.equal(r.parcelas[11].valor, 945.55);
  assert.equal(r.parcelas[11].saldoDevedor, 0);

  assert.equal(r.totalJuros, 1347.15);
  assert.equal(r.totalPago, 11347.15);
});

test('Price: 1 parcela = principal + juros de um mês', () => {
  const r = calculaPrice({ valor: 1000, taxaMes: 0.05, prazoMeses: 1 });

  assert.equal(r.parcelas[0].valor, 1050.00);
  assert.equal(r.parcelas[0].saldoDevedor, 0);
});
