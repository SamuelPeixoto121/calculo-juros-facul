# Backlog — API de Cálculo de Juros

> Base para a rodada de planning poker (10 participantes). As tarefas **não têm estimativa** —
> a coluna de pontos é preenchida na sessão. Fontes: `docs/inventario-processos.md` (processo
> BPMN, atividades #1–#35), `docs/research_tabela-juros-brasil_20260831.md` (fundamentação
> regulatória e de dados, referenciada como §).

## Decisões de escopo (fechadas em 09/09/2026)

| Dimensão | Decisão |
|---|---|
| Escopo | **Processo completo do BPMN**, organizado em fases — permite cortar escopo depois do poker |
| Catálogo | **Todos os 11 produtos PF** da série do BCB (inclui cartão rotativo e cheque especial, que têm caminho de CET próprio — art. 6º da Res. 4.881) |
| Tabela de juros BCB | **Seed estático** — extração única da API Olinda, sem job de ingestão recorrente |
| Integrações externas | **Tudo mockado** — score, esteira e banco/mesa são stubs internos |
| Qualidade | **Sem testes automatizados e sem requisitos de segurança** (auth, rate limit etc.) — projeto acadêmico; validação manual via planilha de conferência e roteiro de demonstração |
| Stack | MySQL + Node.js/Express (o repo já tem esqueleto Express com rotas de juros simples/composto) |

## Trilhas e convenções

- **PROD** — Produto: especificações, regras de negócio, parâmetros, casos de aceitação.
- **DB** — Banco de dados: MySQL, migrations, seed.
- **API** — Node.js/Express: motor de cálculo, orquestração, endpoints.

Cada tarefa traz: descrição, critérios de aceite, dependências e referência ao BPMN (#) ou à pesquisa (§).

**Definition of Done comum** (vale para todas, não repetida em cada tarefa): código revisado por
outro membro; migrations aplicáveis do zero; resultado conferido manualmente (requisição de
exemplo ou planilha); documentação da tarefa atualizada.

---

## Fase 0 — Fundação

### PROD-01 — Definir catálogo dos 11 produtos de crédito PF
Especificar os 11 produtos com base nas modalidades PF da série do BCB (§3), separando
`modalidade` de `regime_indexacao` (não tratar a string do BCB como chave única — §3, nota).
- [ ] Documento com os 11 produtos: nome, modalidade BCB correspondente, regime de indexação, público-alvo.
- [ ] Marcados os produtos com caminho de CET especial (cheque especial, cartão rotativo — §7.3, art. 6º).
- [ ] Financiamento imobiliário e crédito rural explicitamente fora do escopo (§3, nota).

**Dependências:** nenhuma. **Ref:** BPMN #4, §3.

### PROD-02 — Especificar as regras de negócio RN01–RN08
Detalhar cada regra do §7 do inventário em formato executável (fórmula, tabela ou pseudocódigo),
para que DB e API implementem sem ambiguidade.
- [ ] RN01 composição de taxa; RN02 score→faixa→spread; RN03 tetos por produto; RN04 comprometimento de renda; RN05 prazos; RN06 IOF PF (§8); RN07 validade da proposta; RN08 critério de convergência do CET.
- [ ] RN08 define tolerância, nº máximo de iterações e comportamento em não-convergência.
- [ ] Cada RN aponta a fonte normativa quando houver (Res. 4.881, Decreto 6.306 etc.).

**Dependências:** PROD-01. **Ref:** inventário §7, pesquisa §6–§8.

### PROD-03 — Especificar o contrato da API de simulação
Definir request/response dos endpoints públicos, incluindo o **demonstrativo do CET** exigido
pelo art. 7º da Res. 4.881: valor em R$ de cada componente do fluxo, percentual sobre o total
devido e somatório das parcelas (§7.3.5) — não basta devolver o número do CET.
- [ ] Contrato de `POST /simulacoes` (entrada: produto, valor, prazo, sistema de amortização, dados do cliente).
- [ ] Resposta com cronograma, CET % a.a. com 2 casas (arredondamento ABNT NBR 5891) e demonstrativo completo.
- [ ] Contratos dos endpoints de ciclo de vida (decisão do cliente, consulta de proposta).

**Dependências:** PROD-01. **Ref:** §7, BPMN #22.

### PROD-04 — Catálogo de erros e recusas
Unificar as saídas negativas do processo: rejeição por dados inválidos, inelegibilidade, recusa
por limite de política, recusa técnica (score indisponível, CET não converge), recusa do banco.
- [ ] Tabela: código, HTTP status, mensagem, em que ponto do fluxo ocorre.
- [ ] Distingue recusa por política de recusa do banco (BPMN §5.1 — são duas notificações diferentes).

**Dependências:** PROD-02. **Ref:** BPMN #3, #21, #35, exceções §5.

### DB-01 — Ambiente MySQL e ferramenta de migrations
- [ ] MySQL sobe via `docker-compose up` com credenciais em `.env` (exemplo versionado).
- [ ] Ferramenta de migrations escolhida e configurada; migration inicial vazia executa e reverte.
- [ ] README do banco com instruções de setup.

**Dependências:** nenhuma.

### API-01 — Estruturar o projeto Express
Evoluir o esqueleto atual (`src/app.js`, rotas de juros simples/composto) para a estrutura da
entrega: separação rotas / serviços / repositórios, configuração por ambiente, conexão MySQL.
- [ ] Camadas definidas e documentadas; rotas legadas `/simples` e `/composto` mantidas ou absorvidas conscientemente.
- [ ] Pool de conexão MySQL configurado via `.env`; healthcheck `GET /health` verifica banco.

**Dependências:** DB-01.

---

## Fase 1 — Dados de referência e políticas

### PROD-05 — Definir parâmetros de política por produto
Preencher, para cada um dos 11 produtos, os valores que alimentam o seed: teto de taxa (RN03),
prazos mín/máx (RN05), margem, desconto comercial máximo, spread por faixa de risco (RN02),
validade da proposta (RN07), parâmetros de IOF e tarifa de cadastro.
- [ ] Planilha/tabela por produto com todos os parâmetros e data de vigência.
- [ ] Teto do consignado INSS marcado como **pendente de confirmação no DOU** (§6 — fontes divergem entre 1,66% e 1,85%; usar 1,85% provisório).
- [ ] Tetos regulatórios citam a norma (cheque especial 8% a.m. — Res. 4.765; rotativo ≤100% do principal — Lei 14.690/2023).

**Dependências:** PROD-01, PROD-02. **Ref:** §6, BPMN #5.

### DB-02 — Schema: catálogo de produtos
- [ ] Migration das tabelas de produto/modalidade conforme PROD-01, com `modalidade` e `regime_indexacao` em colunas separadas.
- [ ] Flag de caminho de CET especial (art. 6º) por produto.

**Dependências:** DB-01, PROD-01.

### DB-03 — Schema: políticas de produto versionadas por vigência
Parâmetros de política **não são constantes no código** — mudam por resolução, com data de
vigência própria (§6, ressalva). Modelar com `vigencia_inicio`/`vigencia_fim`.
- [ ] Migration da tabela de políticas com versionamento por vigência; consulta "política vigente em D" definida.
- [ ] Sem sobreposição de vigências para o mesmo produto (constraint ou validação).

**Dependências:** DB-02, PROD-05. **Ref:** BPMN #5, §6.

### DB-04 — Schema: limites regulatórios versionados
Separado da política comercial: tetos legais (cheque especial, consignado INSS, rotativo)
com norma de origem e vigência.
- [ ] Migration com: produto/modalidade, tipo de limite, valor, norma, vigência.
- [ ] Comporta o limite "juros+encargos ≤ 100% do principal" do rotativo (é um limite de acumulação, não de taxa).

**Dependências:** DB-02, PROD-05. **Ref:** §6, BPMN #20.

### DB-05 — Extrair e tratar o dataset de taxas do BCB
O CSV citado na pesquisa (`claudedocs/data/bcb_taxas_juros_*.csv`) **não está no repositório**.
Extração única da API Olinda (sem job recorrente — decisão de escopo) e tratamento de outliers.
- [ ] Script de extração de um período da Olinda (`$filter=InicioPeriodo eq '...'`, §2.3) salvo em `data/` versionado.
- [ ] Outliers promocionais tratados (0,00%–0,20% a.m. — winsorizar ou filtrar, §4).
- [ ] Documentado que a taxa BCB **inclui IOF/encargos** e serve como benchmark, não como taxa nominal (§2.4).

**Dependências:** DB-01. **Ref:** §2, §4.

### DB-06 — Schema e carga da tabela de taxas de referência + scripts de seed
- [ ] Migration da tabela de taxas: chave prática `(cnpj8, segmento, modalidade, inicio_periodo)` + `posicao` (§2.2 — `codigoModalidade` vem `null`, não usar como chave).
- [ ] `npm run seed` idempotente: produtos, políticas, limites regulatórios e taxas de referência.
- [ ] Seed reflete os valores definidos em PROD-05.

**Dependências:** DB-03, DB-04, DB-05.

### API-02 — Endpoints de catálogo e política vigente
- [ ] `GET /produtos` lista o catálogo; `GET /produtos/:id/politica` retorna a política vigente na data.
- [ ] Consulta usa o versionamento por vigência (DB-03).

**Dependências:** API-01, DB-06. **Ref:** BPMN #4, #5.

---

## Fase 2 — Motor de cálculo (stateless)

### PROD-06 — Planilha de conferência do motor de cálculo
Calcular de forma independente (planilha) os valores esperados de Price, SAC, IOF e CET para
um conjunto de cenários — é a referência de conferência manual do motor, já que não haverá
testes automatizados.
- [ ] ≥ 2 cenários por produto cobrindo prazos com meses de 28/30/31 dias e fins de semana.
- [ ] Inclui cenário de CET pelo art. 6º (cheque especial/rotativo) e cenário de não-convergência forçada.
- [ ] Valores esperados com tolerância definida (casas decimais).

**Dependências:** PROD-02. **Ref:** §7.

### API-03 — Cálculo de parcelas — Price
- [ ] Função pura: capital, taxa efetiva mensal, prazo → parcela fixa e decomposição juros/amortização por período.
- [ ] Convenção de taxa efetiva composta, coerente com a série do BCB (§2.5).
- [ ] Resultados conferem com a planilha de PROD-06.

**Dependências:** API-01. **Ref:** BPMN #15.

### API-04 — Cálculo de parcelas — SAC
- [ ] Função pura: amortização constante, parcelas decrescentes, decomposição por período.
- [ ] Resultados conferem com a planilha de PROD-06.

**Dependências:** API-01. **Ref:** BPMN #16.

### API-05 — Cronograma de amortização com datas reais
O CET usa **dias corridos/365** (§7.3.1) — o cronograma precisa de datas de vencimento reais,
não períodos idealizados. Substitui a lógica ingênua de `calculaParcela.js`.
- [ ] Geração de datas de vencimento a partir da data de liberação, tratando meses de 28/29/30/31 dias.
- [ ] Regra para vencimento em dia não útil definida e documentada.
- [ ] Saída alimenta diretamente o cálculo do CET (dj − d0 em dias corridos).

**Dependências:** API-03, API-04. **Ref:** BPMN #17, §7.3.

### API-06 — Encargos e tributos (IOF + tarifa de cadastro)
- [ ] IOF PF: 0,0082% a.d. limitado a 365 dias + adicional 0,38% (§8), com alíquotas lidas da política (não hardcoded — confiança média, §10).
- [ ] Tarifa de cadastro **condicional ao início de relacionamento** (STJ Tema 620, §8) — parâmetro de entrada, nunca somada por padrão.
- [ ] Encargos entram no fluxo do CET como componentes datados.

**Dependências:** API-05, DB-06. **Ref:** BPMN #18, §8.

### API-07 — Cálculo do CET por TIR (Res. CMN 4.881/2020)
A norma vigente é a 4.881 — **não** usar a fórmula da Res. 3.517, revogada (§7.1).
- [ ] Resolve a raiz da equação do art. 4º com expoente `(dj−d0)/365` em dias corridos.
- [ ] Newton-Raphson com fallback para bissecção; critério de convergência da RN08; não-convergência lança erro tipado (evento `CET não converge` do BPMN).
- [ ] FC0 deduz despesas pagas antecipadamente; FCj inclui amortização, juros, tarifas, tributos e seguros (§7.2).
- [ ] Saída em % a.a., 2 casas, arredondamento ABNT NBR 5891.
- [ ] Resultados conferem com a planilha de PROD-06.

**Dependências:** API-05, API-06. **Ref:** BPMN #19, §7.

### API-08 — CET pelo caminho do art. 6º (cheque especial e rotativo)
- [ ] Para produtos flagados (DB-02): CET com prazo fixo de 30 dias e valor do limite pactuado, sem cronograma de parcelas (§7.3.4).
- [ ] Seleção automática do caminho pelo produto.

**Dependências:** API-07, DB-02. **Ref:** §7.3.

### API-09 — Demonstrativo do CET na resposta
- [ ] Estrutura do art. 7º: valor em R$ de cada componente, % sobre o total devido, somatório das parcelas.
- [ ] Conforme o contrato de PROD-03.

**Dependências:** API-07, PROD-03. **Ref:** §7.3.5.

---

## Fase 3 — Precificação e políticas

### API-10 — Mock do serviço de score
- [ ] Stub interno com resposta configurável (score fixo por CPF de teste ou aleatório com seed).
- [ ] Simula indisponibilidade sob demanda (para demonstrar o retry de API-19).

**Dependências:** API-01. **Ref:** BPMN #7, exceção §5.

### API-11 — Classificação de rating e spread (RN02)
- [ ] Score → faixa de risco → spread, com a tabela vindo da política (DB-03).
- [ ] Faixas calibradas com a dispersão observada de mercado por modalidade (§4).

**Dependências:** API-02, API-10. **Ref:** BPMN #8, #11.

### API-12 — Custo de captação via SGS com fallback de última cotação
- [ ] Cliente da API SGS usando `/ultimos/{n}` (Selic 432, CDI 12 — §5).
- [ ] Cada cotação obtida é cacheada no MySQL; em falha da SGS, usa a última cotação válida (compensação `Cotação indisponível` do BPMN).
- [ ] Idade da cotação usada registrada na trilha de auditoria.

**Dependências:** API-01, DB-01 (tabela de cache — incluída nesta tarefa). **Ref:** BPMN #9, §5.

### API-13 — Consulta à tabela de juros interna (benchmark de mercado)
- [ ] Dado produto e taxa proposta, retorna posição relativa ao mercado (mediana, percentil, `posicao`) a partir do seed (DB-06).
- [ ] A taxa do BCB **não** entra como insumo da taxa nominal — só comparação (§2.4).

**Dependências:** DB-06, API-02. **Ref:** BPMN #10, §2.4.

### API-14 — Campanhas e descontos comerciais
- [ ] Desconto aplicado sobre o spread conforme parâmetros da política, respeitando desconto máximo (PROD-05).
- [ ] Registrado na memória de cálculo qual campanha foi aplicada.

**Dependências:** API-11. **Ref:** BPMN #12.

### API-15 — Composição da taxa nominal final (RN01)
- [ ] `taxa = custo de captação + spread de risco + margem − desconto`, tudo em taxa efetiva composta na mesma base.
- [ ] Memória de cálculo com cada componente preservada para auditoria.

**Dependências:** API-12, API-14. **Ref:** BPMN #13, RN01.

### API-16 — Validação de limites e ajuste ou recusa
- [ ] Valida taxa/prazo/comprometimento contra política (DB-03) e limites regulatórios (DB-04).
- [ ] Em violação: tenta **ajustar condições ao limite** e recalcular; se inviável, recusa por política com motivo (gateway `Ajuste viável?` do BPMN §5.1).
- [ ] Limite de iterações de ajuste para não entrar em loop.

**Dependências:** API-15, API-07, DB-04. **Ref:** BPMN #20, #21.

---

## Fase 4 — Admissão e simulação de ponta a ponta

### API-17 — Validação de dados de entrada e rejeição
- [ ] Schema de validação do request de simulação (tipos, faixas, produto existente).
- [ ] Rejeição com erros do catálogo PROD-04; requisição inválida não dispara nenhum cálculo.

**Dependências:** PROD-03, PROD-04, API-01. **Ref:** BPMN #2, #3.

### API-18 — Elegibilidade do cliente
- [ ] Regras de elegibilidade por produto (idade, renda, RN04 — comprometimento de renda) lidas da política.
- [ ] Inelegível converge para a mesma rejeição do BPMN (`Rejeitar solicitação`).

**Dependências:** API-02, API-17. **Ref:** BPMN #6.

### DB-08 — Schema: propostas, versões e máquina de estados
- [ ] Migration de propostas com versão, validade (RN07) e estado (`calculada`, `enviada`, `aguardando_cliente`, `aguardando_banco`, `aprovada`, `recusada`, `expirada`...).
- [ ] Transições válidas documentadas (diagrama de estados); versão nova a cada recálculo.

**Dependências:** DB-01, PROD-03. **Ref:** BPMN #23.

### API-19 — Orquestração da simulação (`POST /simulacoes`)
Encadeia o fluxo: validação → elegibilidade → score (com retry) → rating → captação → taxa →
amortização (gateway Price/SAC) → encargos → CET → limites.
- [ ] Fluxo completo executa e retorna proposta conforme contrato PROD-03.
- [ ] Retry no score; indisponibilidade persistente vira recusa técnica (exceção §5 do inventário).
- [ ] Erro de CET não convergente aborta com erro do catálogo PROD-04.

**Dependências:** API-08, API-09, API-16, API-18. **Ref:** BPMN #1–#21.

### API-20 — Montar e persistir a proposta
- [ ] Proposta persistida com versão, validade e estado inicial (DB-08).
- [ ] Consulta `GET /propostas/:id` retorna a proposta com estado atual.

**Dependências:** API-19, DB-08. **Ref:** BPMN #22, #23.

### DB-09 — Schema: trilha de auditoria do cálculo
O art. 7º §2º da Res. 4.881 exige o demonstrativo à disposição do BCB por **no mínimo 5 anos**
(§9) — define conteúdo mínimo e retenção, não é log genérico.
- [ ] Migration da trilha: entrada completa, política e limites vigentes usados (com versão), cotação usada, memória de composição da taxa, demonstrativo do CET, resultado.
- [ ] Imutável (sem UPDATE/DELETE pela aplicação).

**Dependências:** DB-08. **Ref:** BPMN #24, §9.

### API-21 — Registrar trilha de auditoria
- [ ] Toda simulação (inclusive recusada) grava trilha completa em DB-09.
- [ ] Trilha permite reproduzir o cálculo: mesma entrada + mesmos parâmetros versionados → mesmo resultado.

**Dependências:** API-19, DB-09. **Ref:** BPMN #24.

---

## Fase 5 — Ciclo de vida da proposta

### PROD-07 — Regras do ciclo de vida da proposta
Fecha as questões em aberto #2 e #4 do inventário.
- [ ] Prazo de validade por produto (RN07) e comportamento na expiração definidos.
- [ ] Número máximo de simulações alternativas por proposta definido.
- [ ] Definido o canal: cliente interage pelos endpoints da própria API (integrações mockadas).

**Dependências:** PROD-05. **Ref:** inventário §9.

### API-22 — Envio da proposta à esteira (mock)
- [ ] Stub de esteira recebe a proposta (chamada interna ou log estruturado) e o estado muda para `enviada`/`aguardando_cliente`.

**Dependências:** API-20. **Ref:** BPMN #25.

### API-23 — Decisão do cliente (aceita / altera / desiste)
- [ ] `POST /propostas/:id/decisao` com as três ações; transições de estado validadas contra DB-08.
- [ ] Aceite move para `aguardando_banco`; desistência encerra; alteração dispara API-24.
- [ ] Decisão sobre proposta expirada/encerrada retorna erro do catálogo.

**Dependências:** API-22, PROD-07. **Ref:** BPMN #26, #27.

### API-24 — Simulação alternativa
- [ ] Alteração de condições recalcula a partir da composição de taxa (volta ao #13 do BPMN) e gera **nova versão** da proposta.
- [ ] Respeita o limite de simulações de PROD-07; excedente retorna erro.

**Dependências:** API-23, API-19. **Ref:** BPMN #28.

### API-25 — Expiração de propostas por temporizador
- [ ] Job periódico (cron interno) expira propostas com validade vencida em estados de espera.
- [ ] Expiração registrada na trilha; decisões posteriores são rejeitadas.
- [ ] Intervalo do job configurável; execução manual disponível para demonstração.

**Dependências:** API-20, PROD-07. **Ref:** BPMN #29, exceção timeout #26.

---

## Fase 6 — Decisão do banco

### PROD-08 — Especificar o fluxo de contraproposta
Fecha a questão em aberto #5 do inventário.
- [ ] Definido se a contraproposta do banco exige novo aceite do cliente (e o estado correspondente).
- [ ] Definido o tratamento do timeout do banco: escalonamento ou recusa técnica, com prazo.

**Dependências:** PROD-07. **Ref:** inventário §9, BPMN #31–#33.

### API-26 — Submissão ao banco (mock) e recepção da decisão
- [ ] Aceite do cliente submete ao stub do banco; decisão chega por `POST /propostas/:id/decisao-banco` (aprova / contrapropõe / recusa) — o "banco" é operado manualmente na demonstração.
- [ ] Timeout da decisão do banco (temporizador de PROD-08) leva ao tratamento definido.

**Dependências:** API-23, PROD-08. **Ref:** BPMN #30, #31, #32.

### API-27 — Contraproposta e recálculo
- [ ] Condições da contraproposta disparam recálculo completo (motor + limites) e nova versão da proposta.
- [ ] Fluxo de novo aceite conforme PROD-08.

**Dependências:** API-26, API-24. **Ref:** BPMN #33.

### API-28 — Formalização e notificações de desfecho
- [ ] Aprovação formaliza a proposta (estado final `aprovada`, dados de formalização persistidos).
- [ ] Recusa notificada com motivo, distinguindo recusa por política de recusa do banco (duas saídas do BPMN §5.1).
- [ ] Todos os desfechos gravam trilha.

**Dependências:** API-26. **Ref:** BPMN #34, #35.

---

## Fase 7 — Qualidade e entrega

### DB-10 — Índices, integridade e revisão de consultas
- [ ] Índices para as consultas quentes (política vigente, taxas por modalidade, propostas por estado/validade).
- [ ] FKs e constraints revisadas; `EXPLAIN` das consultas principais sem full scan indevido.

**Dependências:** DB-06, DB-08, DB-09.

### API-29 — Documentação OpenAPI
- [ ] Spec OpenAPI de todos os endpoints, servida em `/docs`.
- [ ] Exemplos reais de request/response para cada endpoint.

**Dependências:** API-19, API-23, API-26.

### PROD-09 — Roteiro de demonstração e material de apresentação
Sem testes automatizados, o roteiro de demonstração é a **validação oficial da entrega** —
cada fluxo é exercitado manualmente contra a planilha de PROD-06.
- [ ] Roteiro da demo cobrindo um fluxo feliz e duas exceções (ex.: recusa por limite, CET não converge).
- [ ] Conferência dos valores da demo contra a planilha de PROD-06.
- [ ] Material conecta BPMN → backlog → implementação (rastreabilidade #1–#35).

**Dependências:** demais tarefas da fase 7.

---

## Resumo para o poker

| Trilha | Tarefas |
|---|---|
| Produto (PROD) | 9 |
| Banco de dados (DB) | 10 |
| API (API) | 29 |
| **Total** | **48** |

**Sugestão de condução:** estimar fase a fase, na ordem (as dependências apontam sempre para
trás). Usar **API-03 (Price)** como história de referência de tamanho médio na calibração
inicial. Tarefas com maior incerteza esperada — bons candidatos a discussão: API-07 (CET/TIR),
API-19 (orquestração), DB-09 (auditoria), API-25 (temporizador).

## Riscos e pendências a declarar na sessão

1. **Teto do consignado INSS não confirmado** — fontes divergem (1,66% / 1,80% / 1,85%); seed usa 1,85% provisório e PROD-05 carrega a pendência de confirmar no DOU (§6, confiança baixa).
2. **CSV da pesquisa não está no repositório** — DB-05 refaz a extração da Olinda; se a API estiver indisponível na semana, o plano B é reconstruir a partir das tabelas do §4 da pesquisa.
3. **Alíquotas de IOF com confiança média** (§10) — por isso ficam em parâmetro de política, não em código.
4. **Taxa do BCB ≠ taxa nominal** — ela já embute IOF (§2.4); o desenho inteiro da Fase 3 depende de manter essa separação. Vale reforçar na apresentação.
5. **Pós-fixados fora do CET** (art. 5º, §7.3.3) — os 11 produtos PF escolhidos são prefixados, o que evita o problema; se PJ entrar depois, é escopo novo.
