# Pesquisa: tabela de juros de instituição brasileira como base para a API de cálculo de juros

**Data:** 31/08/2026
**Escopo:** identificar uma fonte de tabela de juros real, brasileira, pública e consumível por API, para servir de base ao serviço modelado em `docs/visualizar-bpmn.html`
**Profundidade:** deep — fontes primárias (BCB, normativos CMN) validadas ao vivo
**Entregável complementar:** `claudedocs/data/bcb_taxas_juros_2026-08-11_a_2026-08-17.csv` (790 linhas, dados reais extraídos)

> Este documento é **somente pesquisa**. Não contém implementação, nem decisão de arquitetura tomada.

---

## 1. Sumário executivo

**Recomendação:** usar a base **"Taxas de juros de operações de crédito por instituição financeira"** do Banco Central do Brasil, via **API Olinda (OData)**, como tabela de juros de referência.

Por que ela, e não a tabela de um banco específico:

| Critério | BCB / Olinda | Tabela de um banco (ex.: Caixa) |
|---|---|---|
| Pública e sem autenticação | Sim — validado ao vivo | Não; normalmente PDF ou tela logada |
| Cobertura | 23 modalidades × ~80 instituições | 1 instituição |
| Licença explícita | ODbL (Open Data Commons) | Indefinida / uso restrito |
| Atualização | Semanal (janela de 5 dias úteis) + mensal | Irregular |
| Histórico | ~1 ano móvel diário; mensal desde 2012 | Não publicado |
| Auditável | É a fonte que o próprio regulador publica | Depende de scraping |

Como o projeto é uma **API pública de simulação**, uma base sob licença aberta e citável é requisito prático, não preferência. E, na prática, a base do BCB *contém* a tabela da Caixa, do BB, do Itaú, do Nubank etc. — cada instituição é uma linha por modalidade.

**Achados que mudam o desenho do cálculo (detalhados adiante):**

1. A taxa publicada pelo BCB **já inclui encargos fiscais e operacionais (IOF)**. Usá-la como taxa nominal e depois somar IOF no CET é **dupla contagem**.
2. A **Resolução CMN 3.517/2007 está revogada** desde 01/02/2021. A norma vigente do CET é a **Resolução CMN 4.881/2020**, com fórmula em **dias corridos / 365**.
3. As taxas do BCB são **efetivas com capitalização composta** — verifiquei numericamente em 788 registros.

---

## 2. Fonte primária recomendada — BCB, API Olinda

### 2.1 Endpoint (validado ao vivo em 31/08/2026)

```
https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosDiariaPorInicioPeriodo
https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosMensalPorMes
```

Protocolo OData v2. Suporta `$format=json`, `$top`, `$skip`, `$select`, `$orderby`, `$filter`.
Swagger: `https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/swagger-ui3`

### 2.2 Estrutura do registro (campos reais retornados)

```json
{
  "InicioPeriodo": "2026-08-11",
  "FimPeriodo": "2026-08-17",
  "codigoSegmento": null,
  "Segmento": "PESSOA FÍSICA",
  "codigoModalidade": null,
  "Modalidade": "Crédito pessoal consignado INSS - Prefixado",
  "Posicao": 1,
  "InstituicaoFinanceira": "NU FINANCEIRA S.A. CFI",
  "cnpj8": "...",
  "TaxaJurosAoMes": 1.52,
  "TaxaJurosAoAno": 19.82
}
```

Observações de campo:

- `cnpj8` — raiz do CNPJ (8 dígitos). É a **chave estável** da instituição; `InstituicaoFinanceira` é texto livre e varia na grafia.
- `codigoSegmento` e `codigoModalidade` vêm **`null`** na carga atual da v2, apesar de existirem no schema. Não dá para depender deles como chave; a chave prática é `(cnpj8, Segmento, Modalidade, InicioPeriodo)`.
- `Posicao` — ranking crescente por taxa dentro de `(Segmento, Modalidade, período)`. Útil para posicionar uma oferta no mercado.

### 2.3 Comportamento de consulta (verificado)

| Verificação | Resultado |
|---|---|
| `$filter=Modalidade eq '...'` com acentos | Funciona, exige percent-encoding correto |
| `$filter=contains(Modalidade,'pessoal')` | Funciona |
| `$apply=groupby(...)` | **Timeout** — não usar |
| `$top=200000` sem filtro | Funciona (~19 MB); mas prefira filtrar por `InicioPeriodo` |
| Janela histórica do endpoint diário | **261 períodos**, de 2025-07-29 a 2026-08-11 (~1 ano móvel) |
| Volume por período | ~790 linhas (PF + PJ) |

Consulta típica para carga incremental:

```
?$format=json&$filter=InicioPeriodo eq '2026-08-11'&$top=5000
```

### 2.4 Metodologia declarada pelo BCB — e o alerta crítico

> "médias aritméticas das taxas de juros pactuadas nas operações realizadas nos cinco dias úteis referidos em cada publicação, **ponderadas pelos respectivos valores contratados**"

> "as taxas de juros efetivamente praticadas pelas instituições financeiras em suas operações de crédito, **acrescidas dos encargos fiscais e operacionais incidentes sobre as operações**"

**Consequência direta para o motor de cálculo:** `TaxaJurosAoMes` **não é** a taxa nominal de contrato. É um custo efetivo médio que já embute IOF e encargos.

Evidência empírica que confirma isso nos dados de 11–17/08/2026:

| Modalidade | Teto legal de juros | Máximo observado no BCB |
|---|---|---|
| Cheque especial PF | 8,00% a.m. (Res. CMN 4.765/2019) | **8,28% a.m.** |
| Consignado INSS PF | ~1,85% a.m. (CNPS) | **1,91% a.m.** |

Os valores estouram o teto justamente porque a série inclui encargos. Não é erro do BCB nem descumprimento do banco — é definição da série. Se a API tratar esse número como taxa de juros e aplicar IOF por cima, o CET sai inflado.

**Uso correto:** tratar a série do BCB como **benchmark de mercado / piso de plausibilidade / valor de referência para o ranking**, e manter a taxa nominal como parâmetro próprio da política do produto.

Demais atributos: defasagem de publicação ~14 dias úteis; licença **ODbL**.

### 2.5 Convenção de taxa — verificada numericamente

Testei `(1 + i_mensal)^12 - 1` contra `TaxaJurosAoAno` em **788 registros** do período:

| Hipótese | Erro mediano |
|---|---|
| Composta: `(1+i)^12 - 1` | **0,045 p.p.** (p95 = 0,17; máx = 0,48) |
| Simples: `i × 12` | 5,27 p.p. |

O resíduo da hipótese composta é compatível com o arredondamento de `TaxaJurosAoMes` em 2 casas. **Conclusão: taxas efetivas, capitalização composta, base mensal.** A API deve adotar a mesma convenção para ser comparável.

---

## 3. Catálogo de modalidades — mapeia para "Identificar produto de crédito" no BPMN

Levantamento completo (200.000 linhas amostradas, todos os períodos). **23 modalidades**, 11 PF e 12 PJ:

### Pessoa Física
| Modalidade | Ocorrências |
|---|---|
| Crédito pessoal não consignado - Prefixado | 20.598 |
| Cartão de crédito - rotativo total - Prefixado | 15.363 |
| Cartão de crédito - parcelado - Prefixado | 15.202 |
| Crédito pessoal consignado privado - Prefixado | 12.720 |
| Crédito pessoal consignado público - Prefixado | 11.550 |
| Aquisição de veículos - Prefixado | 10.330 |
| Aquisição de outros bens - Prefixado | 10.202 |
| Crédito pessoal consignado INSS - Prefixado | 9.309 |
| Cheque especial - Prefixado | 7.261 |
| Desconto de cheques - Prefixado | 799 |
| Arrendamento mercantil de veículos - Prefixado | 5 |

### Pessoa Jurídica
| Modalidade | Ocorrências |
|---|---|
| Desconto de duplicatas - Prefixado | 14.773 |
| Capital de giro com prazo superior a 365 dias - Prefixado | 12.847 |
| Capital de giro com prazo até 365 dias - Prefixado | 11.630 |
| Adiantamento sobre contratos de câmbio (ACC) - Pós-fixado ref. moeda estrangeira | 8.247 |
| Conta garantida - Prefixado | 8.115 |
| Cheque especial - Prefixado | 7.792 |
| Conta garantida - Pós-fixado ref. juros flutuantes | 5.911 |
| Capital de giro > 365 dias - Pós-fixado ref. juros flutuantes | 5.668 |
| Capital de giro até 365 dias - Pós-fixado ref. juros flutuantes | 4.519 |
| Antecipação de faturas de cartão de crédito - Prefixado | 3.568 |
| Desconto de cheques - Prefixado | 1.851 |
| Vendor - Prefixado | 1.740 |

**Nota de escopo:** a série **não cobre financiamento imobiliário nem crédito rural** — ambos têm regime e norma próprios (crédito rural inclusive está excluído da regra de CET). Se o produto imobiliário entrar no escopo da API, é outra fonte e outra pesquisa.

Notar também que o sufixo `- Prefixado` / `- Pós-fixado referenciado em ...` carrega o **regime de indexação**, que no BPMN determina se a taxa é composta uma vez ou reprecificada. Convém que o modelo de produto separe `modalidade` de `regime_indexacao` em vez de tratar a string inteira como chave.

---

## 4. Tabela de referência extraída — dados reais 11–17/08/2026

Amostra por modalidade PF (% a.m.), dataset completo em `claudedocs/data/`:

| Modalidade | n | mín | p25 | mediana | p75 | máx |
|---|---:|---:|---:|---:|---:|---:|
| Crédito pessoal consignado INSS | 37 | 1,52 | 1,70 | **1,83** | 1,86 | 1,91 |
| Crédito pessoal consignado público | 46 | 1,49 | 1,67 | **1,84** | 2,13 | 6,48 |
| Aquisição de veículos | 39 | 0,39 | 1,35 | **1,77** | 2,07 | 3,36 |
| Aquisição de outros bens | 41 | 0,20 | 1,90 | **2,53** | 5,40 | 8,49 |
| Crédito pessoal consignado privado | 54 | 1,61 | 2,75 | **3,40** | 4,19 | 5,62 |
| Crédito pessoal não consignado | 84 | 0,02 | 2,56 | **5,25** | 11,90 | 17,13 |
| Cheque especial | 29 | 0,00 | 5,13 | **7,58** | 8,24 | 8,28 |
| Cartão de crédito - parcelado | 61 | 1,15 | 6,45 | **8,71** | 10,91 | 19,49 |
| Cartão de crédito - rotativo total | 63 | 0,34 | 11,36 | **15,14** | 19,02 | 24,99 |

Exemplos nominais — Consignado INSS, mesma semana:

| Posição | Instituição | % a.m. | % a.a. |
|---:|---|---:|---:|
| 1 | NU FINANCEIRA S.A. CFI | 1,52 | 19,82 |
| 3 | BCO SAFRA S.A. | 1,56 | 20,36 |
| 18 | ITAÚ UNIBANCO S.A. | 1,83 | 24,28 |
| 20 | BCO DO BRASIL S.A. | 1,83 | 24,35 |
| 23 | CAIXA ECONOMICA FEDERAL | 1,84 | 24,46 |
| 28 | BCO SANTANDER (BRASIL) S.A. | 1,86 | 24,78 |
| 37 | PARANA BCO S.A. | 1,91 | 25,49 |

**Qualidade de dado — outliers a tratar antes de usar como seed:**
`0,02% a.m.` em crédito pessoal não consignado, `0,00% a.m.` em cheque especial e `0,20% a.m.` em aquisição de outros bens são reais na série, mas refletem volume promocional/residual, não oferta de mercado. Um seed ingênuo desses valores produz simulações absurdas. Convém winsorizar ou filtrar por posição/volume.

---

## 5. Custo de captação — SGS (BCB), para "Obter custo de captação vigente"

API distinta da Olinda, também pública. Todos os códigos abaixo foram **chamados ao vivo e retornaram dados**:

```
https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{n}?formato=json
https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial=dd/MM/aaaa&dataFinal=dd/MM/aaaa
```

| Código | Série | Último valor obtido |
|---|---|---|
| 432 | Meta Selic (Copom) | **14,00% a.a.** |
| 11 | Selic diária | 0,051660% a.d. (31/08/2026) |
| 12 | CDI diária | 0,051660% a.d. (28/08/2026) |
| 433 | IPCA mensal | 0,07% (jul/2026) |
| 226 | TR | 0,1448 (28/08/2026) |

Restrições da API SGS: desde **26/03/2025** o volume por consulta é limitado — filtros de data passaram a ser obrigatórios, e consultas por período são limitadas a **10 anos**. O formato de data é `dd/MM/aaaa`, diferente do ISO usado na Olinda.

O caminho `/ultimos/{n}` dispensa filtro de data e é o mais adequado para "taxa vigente hoje". A série 432 preenche para frente até o fim do período do Copom corrente — ao ler "a meta de hoje", isso é o comportamento desejado, mas invalida a série para backtest ingênuo.

---

## 6. Limites regulatórios — para "Validar limites regulatórios e de política"

| Produto | Limite | Base normativa | Confiança |
|---|---|---|---|
| Cheque especial | **8,00% a.m.** sobre o valor utilizado | Resolução CMN 4.765/2019, vigente desde 06/01/2020 | Alta |
| Cheque especial — tarifa de limite | Vedada até R$ 500; até **0,25% a.m.** sobre o excedente | Resolução CMN 4.765/2019 | Média |
| Cartão de crédito rotativo | Juros + encargos **≤ 100% do principal** (a dívida não pode mais que dobrar) | Lei 14.690/2023, art. 28 §1º, vigente desde 03/01/2024 | Alta |
| Consignado INSS | **~1,80–1,85% a.m.** — ver ressalva abaixo | Resolução CNPS | **Baixa** |
| Cartão consignado / benefício | **2,46% a.m.** | Resolução CNPS | Média |
| Margem consignável INSS | 45% total: 35% empréstimo + 5% por cartão | Normativo INSS | Média |

### Ressalva importante sobre o teto do consignado INSS

As fontes secundárias divergem entre **1,66%**, **1,80%** e **1,85% a.m.** — o CNPS alterou o teto mais de uma vez em 2025 (Res. 1.365 reduziu para 1,66%; reunião de 25/03/2025 elevou para 1,85%). Não consegui confirmar o valor vigente em agosto/2026 contra fonte oficial: a página do INSS que buscaria isso retornou 404.

Os dados do BCB são consistentes com um teto na faixa de 1,85%: mediana 1,83%, p75 1,86%, e nenhuma instituição acima de 1,91% (com encargos embutidos).

**Isto é um achado de arquitetura, não só uma lacuna de pesquisa:** tetos regulatórios mudam várias vezes por ano, por resolução de conselho, com data de vigência própria. Não podem ser constantes no código. Pertencem a uma tabela de parâmetros versionada por vigência — que é exatamente o que a atividade `Carregar política vigente do produto` do BPMN já prevê. Antes de ir a produção, o valor precisa ser lido do DOU / resolução CNPS vigente.

Contexto adicional: em agosto/2026 o **STF decidiu, por unanimidade**, que INSS e CNPS **podem** fixar teto de juros do consignado para aposentados, pensionistas do RGPS e beneficiários do BPC. A competência está pacificada.

---

## 7. CET — norma vigente e fórmula exata

### 7.1 A norma que você provavelmente ia usar está revogada

A **Resolução CMN 3.517/2007** — a mais citada em blogs e material didático — foi **revogada em 01/02/2021**. Também foram revogadas as Resoluções 3.909/2010 e 4.197/2013.

**Norma vigente: Resolução CMN nº 4.881, de 23/12/2020.** Texto integral extraído do PDF oficial do BCB.

### 7.2 Fórmula (art. 4º, transcrição)

```
         N          FCj
FC0  =   Σ   ─────────────────────
        j=1   (1 + CET)^((dj-d0)/365)
```

Definições literais da norma:

- **FC0** = valor do crédito a ser concedido, **deduzido, se for o caso, das despesas e tarifas pagas antecipadamente**
- **FCj** = valores a serem cobrados do interessado, periódicos ou não, incluindo **amortizações, juros, tarifas, tributos e seguros**, bem como qualquer outro custo ou encargo vinculado à operação
- **j** = j-ésimo intervalo entre a data do pagamento e a data do desembolso inicial, **expresso em dias corridos**
- **N** = prazo do contrato, em dias corridos
- **dj** = data do pagamento dos valores cobrados
- **d0** = data da liberação do crédito

Parágrafo único: o CET deve ser **expresso em taxa percentual anual** e **divulgado com duas casas decimais**, usando arredondamento **ABNT NBR 5891**.

### 7.3 Implicações diretas para o motor

1. **Base de tempo é dias corridos / 365** — actual/365, não 12 períodos mensais iguais. Um cronograma Price com parcelas em datas reais (com fins de semana, meses de 28/30/31 dias) dá CET diferente do cálculo mensal idealizado. É a diferença entre passar e não passar numa auditoria.
2. O CET é a **raiz da equação** (TIR do fluxo). Não tem forma fechada — resolver por Newton-Raphson ou bissecção, com tratamento do caso "não converge" — que o BPMN já modelou como o evento de borda `CET não converge`.
3. **Art. 5º:** referenciais que variam ao longo do prazo (taxas flutuantes, índices de preços) **não entram** no CET; devem ser informados separadamente no demonstrativo. Ou seja, para as modalidades pós-fixadas do catálogo, o CET é calculado sobre a parte prefixada.
4. **Art. 6º:** para adiantamento a depositantes, desconto, cheque especial e rotativo, o CET usa parâmetros fixos: **prazo de 30 dias** e **valor do limite pactuado**. É um caminho de cálculo separado, não o cronograma de parcelas.
5. **Art. 7º:** obrigatório apresentar o **demonstrativo** com o valor em reais de cada componente do fluxo e o respectivo percentual sobre o total devido, além do somatório das parcelas. Isso define o contrato de resposta da API — não basta devolver o número do CET.
6. **Art. 9º:** não se aplica a repasses de recursos externos nem a crédito rural.
7. Âmbito (art. 1º): pessoas naturais, empresários individuais, ME e EPP.

---

## 8. Tributos e tarifas — para "Calcular encargos e tributos"

### IOF sobre operações de crédito

Base: Decreto 6.306/2007, alterado pelos **Decretos 12.466/2025 e 12.499/2025** (mantidos pelo STF em julho/2025).

| Componente | Pessoa Física | Pessoa Jurídica |
|---|---|---|
| Alíquota diária | 0,0082% a.d., limitada a **365 dias** (teto ~3,00%) | 0,0082% a.d., limitada a 365 dias |
| Adicional fixo | 0,38% | 0,95% |
| Teto combinado aproximado | ~3,38% | ~3,95% |

Confiança: **média** — as alíquotas de 2025 passaram por decreto derrubado no Congresso e restabelecido por decisão do STF, e as fontes que confirmei são secundárias (consultorias tributárias). Antes de produção, confirmar contra o texto consolidado do Decreto 6.306/2007 no Planalto.

### Tarifa de cadastro (TC)

- Base: **Resolução CMN 3.919/2010**, vigente desde 01/03/2011.
- Fato gerador: pesquisa em serviços de proteção ao crédito e tratamento de dados **necessários ao início de relacionamento**.
- **Não pode ser cobrada cumulativamente.**
- **STJ, Tema Repetitivo 620:** só pode ser cobrada no **início do relacionamento** entre consumidor e instituição.

Para a API isso significa que a TC não é um parâmetro livre do produto — é condicional ao histórico do cliente com a instituição. Um simulador que sempre soma TC superestima o CET de cliente recorrente.

---

## 9. Mapeamento para o BPMN existente

O processo em `docs/visualizar-bpmn.html` (raias: *API/Orquestração*, *Motor de Políticas*, *Motor de Cálculo*) já tem os pontos de entrada certos:

| Atividade no BPMN | Fonte pesquisada |
|---|---|
| `Identificar produto de crédito` | Catálogo de 23 modalidades (§3) |
| `Carregar política vigente do produto` | Tabela de parâmetros versionada — inclui os tetos do §6 |
| `Obter custo de captação vigente` | SGS 432 / 11 / 12 (§5) |
| `Recuperar última cotação válida` (compensação de `Cotação indisponível`) | Cache do último valor SGS — a API SGS tem indisponibilidades reais |
| `Consultar tabela de juros interna` | Ingestão da Olinda (§2), com a ressalva do §2.4 |
| `Determinar spread por risco` | Faixas do §4 dão a dispersão observada de mercado por modalidade |
| `Calcular parcelas — Price / SAC` | Convenção composta efetiva (§2.5) |
| `Calcular encargos e tributos` | IOF + TC (§8) |
| `Calcular CET` + `CET não converge` | Resolução 4.881/2020, actual/365, TIR (§7) |
| `Validar limites regulatórios e de política` | §6 |
| `Registrar trilha de auditoria do cálculo` | Art. 7º §2º da 4.881: demonstrativo à disposição do BCB por **no mínimo 5 anos** |

Vale notar que a exigência de retenção de 5 anos do art. 7º §2º é mais forte do que "trilha de auditoria" genérica — ela define prazo e conteúdo mínimo do que precisa ser persistido.

---

## 10. Confiança, lacunas e riscos

### Alta confiança — verificado diretamente por mim
- Endpoint Olinda, estrutura de campos, comportamento de query, janela histórica
- Catálogo completo de 23 modalidades
- Convenção de capitalização composta (testada em 788 registros)
- Códigos e respostas da API SGS
- Texto integral e fórmula da Resolução CMN 4.881/2020, e a revogação da 3.517
- Metodologia e licença ODbL declaradas pelo BCB

### Confiança média — fonte secundária, confirmar antes de produção
- Alíquotas de IOF vigentes (histórico normativo turbulento em 2025)
- Teto de 2,46% a.m. do cartão consignado
- Detalhe da tarifa de limite do cheque especial (0,25% sobre o excedente de R$ 500)

### Baixa confiança — bloqueia produção, não bloqueia protótipo
- **Teto vigente do consignado INSS.** Fontes divergem entre 1,66%, 1,80% e 1,85%. Precisa ser lido da resolução CNPS vigente no DOU.

### Não resolvido
- **Open Finance Brasil como fonte de taxas *ofertadas*.** Conceitualmente é a fonte mais próxima de "a tabela que o banco realmente usa" — taxas oferecidas com faixas mín/máx por produto, e não médias realizadas. Sondei quatro endpoints públicos prováveis (BB, Itaú, Bradesco, Santander): retornaram 403/404. Os caminhos reais precisam ser descobertos via o Diretório de Participantes do Open Finance, o que é uma pesquisa própria. **Não é bloqueio** — a base do BCB atende ao objetivo; é uma melhoria futura.
- Financiamento imobiliário e crédito rural estão fora da série do BCB e teriam de vir de outra fonte.

### Riscos de dependência
- A Olinda tem **defasagem de ~14 dias úteis**. Uma API que promete "taxas de hoje" está, na verdade, servindo taxas de ~3 semanas atrás. Isso é uma questão de contrato com o consumidor da API, não um bug.
- A janela diária é **móvel de ~1 ano**. Para histórico mais longo, é preciso o endpoint mensal — e persistir localmente, senão o histórico simplesmente some.
- `$apply=groupby` dá timeout; o serviço tem limites de carga reais.
- A SGS passou a exigir filtros de data em 26/03/2025 — mudanças de contrato acontecem sem aviso longo.

---

## 11. Fontes

**Primárias — consultadas diretamente**
- [Taxas de juros de operações de crédito por instituição financeira — Portal de Dados Abertos do BCB](https://dadosabertos.bcb.gov.br/dataset/taxas-de-juros-de-operacoes-de-credito)
- API Olinda: `https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosDiariaPorInicioPeriodo`
- API SGS: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados`
- [Resolução CMN nº 4.881, de 23/12/2020 (CET — vigente)](https://www.bcb.gov.br/content/estabilidadefinanceira/especialnor/Resolu%C3%A7%C3%A3o4881.pdf)
- [Resolução nº 3.517/2007 (revogada)](https://normativos.bcb.gov.br/Lists/Normativos/Attachments/48005/Res_3517_v4_P.pdf)
- [Resolução CMN nº 4.765, de 27/11/2019 (cheque especial)](https://normativos.bcb.gov.br/Lists/Normativos/Attachments/50875/Res_4765_v2_P.pdf)
- [Resolução nº 3.919, de 25/11/2010 (tarifas)](https://www.bcb.gov.br/pre/normativos/res/2010/pdf/res_3919_v4_p.pdf)

**Secundárias**
- [Já está valendo a limitação de juros para cheque especial — gov.br](https://www.gov.br/pt-br/noticias/financas-impostos-e-gestao-publica/2020/01/ja-esta-valendo-a-limitacao-de-juros-para-cheque-especial)
- [Novo limite para juros do cartão de crédito — Rádio Senado](https://www12.senado.leg.br/radio/1/noticia/2024/01/03/novo-limite-para-juros-do-cartao-de-credito-foi-fruto-de-lei-aprovada-no-congresso)
- [Teto de juros do consignado do INSS subirá para 1,85% ao mês — Agência Brasil](https://agenciabrasil.ebc.com.br/economia/noticia/2025-03/teto-de-juros-do-consignado-do-inss-subira-para-185-ao-mes)
- [Novo Teto de juros para empréstimos consignados do INSS — Ministério da Previdência Social](https://www.gov.br/previdencia/pt-br/noticias/2025/janeiro/novo-teto-de-juros-para-emprestimos-consignados-do-inss)
- [STF: INSS e CNPS podem fixar teto de juros do consignado — Migalhas](https://www.migalhas.com.br/quentes/463482/stf-inss-e-cnps-podem-fixar-teto-de-juros-do-consignado-a-aposentados)
- [Governo Federal altera regras do IOF — TozziniFreire](https://tozzinifreire.com.br/boletins/governo-federal-altera-regras-do-iof)
- [IOF — Alterações, Decreto Federal nº 12.499/2025 — PwC Brasil](https://www.pwc.com.br/pt/consultoria-tributaria-societaria/thinking-about-taxes/tax-legis/2025/iof-alteracoes-decreto-federal-12499-2025.html)
- [Tarifa de cadastro — Legalidade (STJ Tema 620) — TJDFT](https://www.tjdft.jus.br/consultas/jurisprudencia/jurisprudencia-em-temas/jurisprudencia-em-detalhes/acao-revisional-de-contrato-bancario/legalidade-da-tarifa-de-registro-de-cadastro)
- [Fórmula para cálculo do CET — Caixa Econômica Federal](https://www.caixa.gov.br/Downloads/credito-cet/FORMULA_PARA_CALCULO_CET.pdf)
- [API Loans — Open Finance Brasil 2.0.1](https://openbanking-brasil.github.io/openapi/swagger-apis/loans/?urls.primaryName=2.0.1)

---

## 12. Decisão que cabe a você

A pesquisa para aqui, conforme o escopo do comando. As escolhas em aberto:

1. **Adotar a base do BCB/Olinda** como tabela de referência, ou insistir numa instituição específica.
2. **Papel da taxa do BCB no cálculo:** benchmark comparativo (recomendado, dado o §2.4) ou insumo direto da taxa nominal.
3. **Estratégia de ingestão:** consulta ao vivo por requisição, ou carga periódica com persistência local — decisão pressionada pela defasagem de 14 dias úteis e pela janela móvel de 1 ano.
4. **Confirmar o teto do consignado INSS** contra o DOU antes de qualquer uso não-demonstrativo.

Próximos passos naturais: `/sc:design` para a arquitetura da API, ou `/sc:implement` para o motor de cálculo.
