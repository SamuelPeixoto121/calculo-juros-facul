# Serviço de Cálculo de Juros — Inventário de Processos

> Documento de levantamento. Base para a modelagem BPMN da 1ª entrega.

## 1. Identificação

- **Disciplina:** _(preencher)_
- **Grupo:** _(preencher nomes e matrículas)_
- **Data:** _(preencher)_

## 2. Funcionalidade

Serviço de **cálculo de juros e geração de proposta de crédito**, consumido por uma
esteira de crédito. O serviço recebe os dados da operação e do cliente, apura a taxa
aplicável, calcula o plano de pagamento e o Custo Efetivo Total (CET), e conduz o
ciclo de vida da proposta até a decisão final do banco.

## 3. Decisões de escopo

| Dimensão | Decisão | Consequência na modelagem |
|---|---|---|
| Escopo | **Orquestração completa (stateful)** | O serviço mantém estado da proposta: entram espera pela decisão do cliente, expiração por temporizador e tratamento de contraproposta do banco |
| Produto | **Genérico / múltiplos produtos** | Exige carga de política parametrizada por produto; regras de teto, prazo e tributo vêm da política, não são fixas no fluxo |
| Cálculo | **Price + SAC + CET** | Gateway exclusivo por sistema de amortização; CET por resolução iterativa (TIR) |

## 4. Inventário de processos

Coluna "Tipo" indica o elemento BPMN correspondente.

### 4.1 Admissão

| # | Processo | Tipo BPMN | Raia |
|---|---|---|---|
| 1 | Receber solicitação de simulação | Evento de início de mensagem | API/Orquestração |
| 2 | Validar dados de entrada | Tarefa de regra de negócio | API/Orquestração |
| 3 | Rejeitar solicitação inválida | Tarefa de envio → fim | API/Orquestração |
| 4 | Identificar produto de crédito | Tarefa de regra de negócio | Motor de Políticas |
| 5 | Carregar política vigente do produto | Tarefa de serviço | Motor de Políticas |
| 6 | Verificar elegibilidade do cliente | Tarefa de regra de negócio | Motor de Políticas |

### 4.2 Apuração de risco e preço

| # | Processo | Tipo BPMN | Raia |
|---|---|---|---|
| 7 | Consultar score do cliente | Tarefa de serviço (+ msg p/ pool externo) | API/Orquestração |
| 8 | Classificar faixa de risco (rating) | Tarefa de regra de negócio | Motor de Políticas |
| 9 | Obter custo de captação vigente | Tarefa de serviço | Motor de Cálculo |
| 10 | Consultar tabela de juros interna | Tarefa de serviço | Motor de Políticas |
| 11 | Determinar spread por risco | Tarefa de regra de negócio | Motor de Políticas |
| 12 | Aplicar campanhas e descontos comerciais | Tarefa de regra de negócio | Motor de Políticas |
| 13 | Compor taxa nominal final | Tarefa de serviço | Motor de Cálculo |

### 4.3 Cálculo financeiro

| # | Processo | Tipo BPMN | Raia |
|---|---|---|---|
| 14 | Selecionar sistema de amortização | Gateway exclusivo (Price / SAC) | Motor de Cálculo |
| 15 | Calcular parcelas — Price | Tarefa de serviço | Motor de Cálculo |
| 16 | Calcular parcelas — SAC | Tarefa de serviço | Motor de Cálculo |
| 17 | Gerar cronograma de amortização | Tarefa de serviço | Motor de Cálculo |
| 18 | Calcular encargos e tributos (IOF, TAC, seguro) | Tarefa de serviço | Motor de Cálculo |
| 19 | Calcular CET | Tarefa de serviço (iterativa) | Motor de Cálculo |
| 20 | Validar limites regulatórios e de política | Tarefa de regra de negócio | Motor de Políticas |
| 21 | Ajustar condições ou recusar por limite | Gateway exclusivo + tarefa | Motor de Políticas |

### 4.4 Ciclo de vida da proposta

| # | Processo | Tipo BPMN | Raia |
|---|---|---|---|
| 22 | Montar proposta | Tarefa de serviço | API/Orquestração |
| 23 | Persistir proposta com versão e validade | Tarefa de serviço | API/Orquestração |
| 24 | Registrar trilha de auditoria do cálculo | Tarefa de serviço | API/Orquestração |
| 25 | Enviar proposta à esteira | Tarefa de envio | API/Orquestração |
| 26 | Aguardar decisão do cliente | Tarefa de recebimento (+ temporizador anexado) | API/Orquestração |
| 27 | Avaliar decisão do cliente | Gateway exclusivo (aceita / altera / desiste) | API/Orquestração |
| 28 | Gerar simulação alternativa | Subprocesso (retorna ao #13) | Motor de Cálculo |
| 29 | Expirar proposta | Evento de fim (via temporizador) | API/Orquestração |

### 4.5 Decisão do banco

| # | Processo | Tipo BPMN | Raia |
|---|---|---|---|
| 30 | Submeter proposta ao banco | Tarefa de envio → pool Banco | API/Orquestração |
| 31 | Aguardar decisão do banco | Evento intermediário de mensagem (+ temporizador) | API/Orquestração |
| 32 | Avaliar retorno do banco | Gateway exclusivo (aprova / contraproposta / recusa) | API/Orquestração |
| 33 | Recalcular sob condições da contraproposta | Subprocesso (retorna ao #13) | Motor de Cálculo |
| 34 | Formalizar proposta aprovada | Tarefa de serviço | API/Orquestração |
| 35 | Notificar recusa com motivo | Tarefa de envio → fim | API/Orquestração |

## 5. Exceções

Modelar como eventos intermediários anexados às tarefas correspondentes.

| Exceção | Anexado a | Tratamento |
|---|---|---|
| Indisponibilidade do serviço de score | #7 | Retry; se persistir, recusa técnica |
| Timeout na decisão do cliente | #26 | Expiração da proposta (#29) |
| Timeout na decisão do banco | #31 | Escalonamento ou recusa técnica |
| Falha na consulta de custo de captação | #9 | Retry; fallback para última cotação válida |
| Não convergência do cálculo do CET | #19 | Erro técnico; abortar simulação |

## 5.1 Ajustes aplicados na modelagem

Três pontos do inventário mudaram ao virar diagrama. O arquivo `processo-principal.bpmn`
segue estas versões.

| Item | Inventário | No BPMN | Motivo |
|---|---|---|---|
| #31 Aguardar decisão do banco | Evento intermediário de mensagem | **Tarefa de recebimento** | Eventos de borda só se anexam a atividades. Como o passo precisa de temporizador, tem que ser tarefa |
| #21 Ajustar ou recusar por limite | Gateway + tarefa | Tarefa **Ajustar condições ao limite** + gateway **Ajuste viável?** | Separa a ação da decisão; o "sim" volta ao recálculo, o "não" segue para recusa |
| #35 Notificar recusa com motivo | Uma tarefa | Duas: **Notificar recusa por política** (Motor de Políticas) e **Notificar recusa do banco** (Orquestração) | Recusas em fases diferentes, com origens e conteúdos diferentes |

Recusas anteriores à proposta (dados inválidos e inelegibilidade) convergem em
**Rejeitar solicitação**, na raia de orquestração.

## 6. Pools

| Pool | Detalhamento | Raias |
|---|---|---|
| Esteira de Crédito | Caixa-preta | — |
| **Serviço de Cálculo de Juros** | **Detalhado — processo principal** | API/Orquestração, Motor de Cálculo, Motor de Políticas |
| Serviço de Score | Caixa-preta (outra equipe) | — |
| Banco / Mesa de Crédito | Caixa-preta | — |

## 7. Regras de negócio a especificar

- RN01 — Composição da taxa: custo de captação + spread de risco + margem − desconto comercial
- RN02 — Mapeamento score → faixa de risco → spread
- RN03 — Teto de taxa por produto (parâmetro de política)
- RN04 — Limite de comprometimento de renda
- RN05 — Prazo mínimo e máximo por produto
- RN06 — Base de cálculo do IOF por tipo de pessoa (PF/PJ)
- RN07 — Prazo de validade da proposta
- RN08 — Critério de convergência do CET

## 8. Referências (verificar edição e vigência)

1. OMG. *Business Process Model and Notation (BPMN) Version 2.0*. Object Management Group, 2011.
2. DUMAS, M.; LA ROSA, M.; MENDLING, J.; REIJERS, H. *Fundamentals of Business Process Management*. 2. ed. Springer, 2018.
3. ASSAF NETO, A. *Matemática Financeira e suas Aplicações*. São Paulo: Atlas.
4. BRASIL. Conselho Monetário Nacional. Resolução CMN n° 4.881
5. THOMAS, L. C. *Consumer Credit Models: Pricing, Profit and Portfolios*. Oxford University Press.
6. NEWMAN, S. *Building Microservices*. 2. ed. O'Reilly.

## 9. Questões em aberto

- [ ] Quais produtos concretos entram no catálogo inicial?
- [ ] O cliente interage via esteira ou o serviço tem canal próprio?
- [ ] A tabela de juros é consultada em tempo real ou replicada localmente?
- [ ] Quantas simulações alternativas são permitidas antes de encerrar (#28)?
- [ ] A contraproposta do banco (#33) precisa de novo aceite do cliente?
