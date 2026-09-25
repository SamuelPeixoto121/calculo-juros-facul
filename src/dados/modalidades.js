// Catálogo das modalidades de crédito que a API simula.
// Taxas em % ao mês (1.60 = 1,60% a.m.). Valores PROVISÓRIOS definidos pela equipe.
// Referência (mediana BCB 11–17/08/2026, já com IOF): INSS 1,83 | público 1,84 |
// privado 3,40 | veículos 1,77 | outros bens 2,53 | pessoal 5,25.
export const MODALIDADES = [
  {
    codigo: 'CREDITO_PESSOAL',
    nome: 'Crédito pessoal não consignado',
    modalidadeBcb: 'Crédito pessoal não consignado - Prefixado',
    publico: 'PF',
    regimeIndexacao: 'PREFIXADO',
    taxaBaseMes: 4.50,
    tetoTaxaMes: 12.00,
    prazoMinMeses: 3,
    prazoMaxMeses: 48,
    sistemas: ['PRICE', 'SAC'],
    descricao: 'Empréstimo sem garantia, pago em parcelas mensais.',
  },
  {
    codigo: 'CONSIGNADO_INSS',
    nome: 'Crédito pessoal consignado INSS',
    modalidadeBcb: 'Crédito pessoal consignado INSS - Prefixado',
    publico: 'PF',
    regimeIndexacao: 'PREFIXADO',
    taxaBaseMes: 1.60,
    tetoTaxaMes: 1.85, // teto regulatório CNPS — provisório, confirmar no DOU
    prazoMinMeses: 6,
    prazoMaxMeses: 84,
    sistemas: ['PRICE', 'SAC'],
    descricao: 'Parcelas descontadas diretamente do benefício do INSS.',
  },
  {
    codigo: 'CONSIGNADO_PUBLICO',
    nome: 'Crédito pessoal consignado público',
    modalidadeBcb: 'Crédito pessoal consignado público - Prefixado',
    publico: 'PF',
    regimeIndexacao: 'PREFIXADO',
    taxaBaseMes: 1.60,
    tetoTaxaMes: 2.50,
    prazoMinMeses: 6,
    prazoMaxMeses: 96,
    sistemas: ['PRICE', 'SAC'],
    descricao: 'Parcelas descontadas em folha de servidor público.',
  },
  {
    codigo: 'CONSIGNADO_PRIVADO',
    nome: 'Crédito pessoal consignado privado',
    modalidadeBcb: 'Crédito pessoal consignado privado - Prefixado',
    publico: 'PF',
    regimeIndexacao: 'PREFIXADO',
    taxaBaseMes: 2.80,
    tetoTaxaMes: 4.50,
    prazoMinMeses: 6,
    prazoMaxMeses: 48,
    sistemas: ['PRICE', 'SAC'],
    descricao: 'Parcelas descontadas em folha de empresa privada.',
  },
  {
    codigo: 'VEICULOS',
    nome: 'Aquisição de veículos',
    modalidadeBcb: 'Aquisição de veículos - Prefixado',
    publico: 'PF',
    regimeIndexacao: 'PREFIXADO',
    taxaBaseMes: 1.50,
    tetoTaxaMes: 3.00,
    prazoMinMeses: 12,
    prazoMaxMeses: 60,
    sistemas: ['PRICE', 'SAC'],
    descricao: 'Financiamento de veículo com o bem em garantia.',
  },
  {
    codigo: 'OUTROS_BENS',
    nome: 'Aquisição de outros bens',
    modalidadeBcb: 'Aquisição de outros bens - Prefixado',
    publico: 'PF',
    regimeIndexacao: 'PREFIXADO',
    taxaBaseMes: 2.20,
    tetoTaxaMes: 5.00,
    prazoMinMeses: 3,
    prazoMaxMeses: 36,
    sistemas: ['PRICE', 'SAC'],
    descricao: 'Financiamento de bens duráveis (eletrodomésticos, móveis etc.).',
  },
];

// Devolve a modalidade pelo código ou undefined se não existir.
export function buscaModalidade(codigo) {
  return MODALIDADES.find((m) => m.codigo === codigo);
}
