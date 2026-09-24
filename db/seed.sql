USE calculo_juros;

-- 1) INSERÇÃO DAS 6 MODALIDADES
INSERT INTO modalidades (
  codigo, nome, modalidade_bcb, publico, regime_indexacao, 
  teto_taxa_mes, taxa_referencia_bcb_mes, prazo_min_meses, prazo_max_meses, descricao, ativo
) VALUES
('CREDITO_PESSOAL_NON_CONSIGNE', 'Crédito Pessoal Não Consignado', 'Empréstimo pessoal não consignado', 'PF', 'PREFIXADO', 12.50, 6.20, 2, 72, 'Empréstimo pessoal sem garantia tradicional', TRUE),
('CREDITO_PESSOAL_CONSIGNE_INSS', 'Consignado INSS', 'Empréstimo pessoal consignado INSS', 'PF', 'PREFIXADO', 2.14, 1.80, 6, 84, 'Crédito consignado para aposentados e pensionistas do INSS', TRUE),
('CREDITO_PESSOAL_CONSIGNE_PUBLICO', 'Consignado Servidor Público', 'Empréstimo pessoal consignado setor público', 'PF', 'PREFIXADO', 2.50, 1.95, 6, 96, 'Crédito consignado para servidores públicos federais, estaduais e municipais', TRUE),
('CREDITO_PESSOAL_CONSIGNE_PRIVADO', 'Consignado CLT Privado', 'Empréstimo pessoal consignado setor privado', 'PF', 'PREFIXADO', 3.50, 2.60, 3, 60, 'Crédito consignado para trabalhadores de empresas privadas conveniadas', TRUE),
('VEICULOS_AUTOMOVEIS', 'Financiamento de Veículos', 'Aquisição de veículos - Pessoas físicas', 'PF', 'PREFIXADO', 4.80, 1.90, 6, 60, 'Financiamento para aquisição de veículos automotores novos e usados', TRUE),
('IMOBILIARIO_TP_TR', 'Financiamento Imobiliário (Pre-fixado/TR)', 'Financiamento imobiliário - Tabela Price/SAC com TR', 'PF', 'PREFIXADO', 1.50, 0.95, 24, 420, 'Financiamento imobiliário residencial com indexador TR', TRUE)
AS novos_dados
ON DUPLICATE KEY UPDATE 
  nome = novos_dados.nome,
  teto_taxa_mes = novos_dados.teto_taxa_mes;

-- 2) INSERÇÃO DAS 30 FAIXAS DE JUROS
INSERT INTO faixas_juros (modalidade_codigo, faixa, score_min, score_max, taxa_mes, taxa_ano, descricao) VALUES
-- CREDITO_PESSOAL_NON_CONSIGNE
('CREDITO_PESSOAL_NON_CONSIGNE', 'A', 801, 1000, 3.20, 45.93, 'Risco Excelente'),
('CREDITO_PESSOAL_NON_CONSIGNE', 'B', 601, 800, 4.50, 69.59, 'Risco Bom'),
('CREDITO_PESSOAL_NON_CONSIGNE', 'C', 401, 600, 6.80, 120.35, 'Risco Médio'),
('CREDITO_PESSOAL_NON_CONSIGNE', 'D', 201, 400, 9.50, 203.88, 'Risco Alto'),
('CREDITO_PESSOAL_NON_CONSIGNE', 'E', 0, 200, NULL, NULL, 'Reprovado por Risco'),

-- CREDITO_PESSOAL_CONSIGNE_INSS
('CREDITO_PESSOAL_CONSIGNE_INSS', 'A', 801, 1000, 1.65, 21.70, 'Risco Excelente'),
('CREDITO_PESSOAL_CONSIGNE_INSS', 'B', 601, 800, 1.75, 23.14, 'Risco Bom'),
('CREDITO_PESSOAL_CONSIGNE_INSS', 'C', 401, 600, 1.89, 25.18, 'Risco Médio'),
('CREDITO_PESSOAL_CONSIGNE_INSS', 'D', 201, 400, 2.05, 27.57, 'Risco Alto'),
('CREDITO_PESSOAL_CONSIGNE_INSS', 'E', 0, 200, NULL, NULL, 'Reprovado por Risco'),

-- CREDITO_PESSOAL_CONSIGNE_PUBLICO
('CREDITO_PESSOAL_CONSIGNE_PUBLICO', 'A', 801, 1000, 1.70, 22.42, 'Risco Excelente'),
('CREDITO_PESSOAL_CONSIGNE_PUBLICO', 'B', 601, 800, 1.85, 24.60, 'Risco Bom'),
('CREDITO_PESSOAL_CONSIGNE_PUBLICO', 'C', 401, 600, 2.05, 27.57, 'Risco Médio'),
('CREDITO_PESSOAL_CONSIGNE_PUBLICO', 'D', 201, 400, 2.30, 31.37, 'Risco Alto'),
('CREDITO_PESSOAL_CONSIGNE_PUBLICO', 'E', 0, 200, NULL, NULL, 'Reprovado por Risco'),

-- CREDITO_PESSOAL_CONSIGNE_PRIVADO
('CREDITO_PESSOAL_CONSIGNE_PRIVADO', 'A', 801, 1000, 2.20, 29.84, 'Risco Excelente'),
('CREDITO_PESSOAL_CONSIGNE_PRIVADO', 'B', 601, 800, 2.60, 36.07, 'Risco Bom'),
('CREDITO_PESSOAL_CONSIGNE_PRIVADO', 'C', 401, 600, 2.95, 41.75, 'Risco Médio'),
('CREDITO_PESSOAL_CONSIGNE_PRIVADO', 'D', 201, 400, 3.40, 49.36, 'Risco Alto'),
('CREDITO_PESSOAL_CONSIGNE_PRIVADO', 'E', 0, 200, NULL, NULL, 'Reprovado por Risco'),

-- VEICULOS_AUTOMOVEIS
('VEICULOS_AUTOMOVEIS', 'A', 801, 1000, 1.45, 18.89, 'Risco Excelente'),
('VEICULOS_AUTOMOVEIS', 'B', 601, 800, 1.80, 23.87, 'Risco Bom'),
('VEICULOS_AUTOMOVEIS', 'C', 401, 600, 2.40, 32.92, 'Risco Médio'),
('VEICULOS_AUTOMOVEIS', 'D', 201, 400, 3.20, 45.93, 'Risco Alto'),
('VEICULOS_AUTOMOVEIS', 'E', 0, 200, NULL, NULL, 'Reprovado por Risco'),

-- IMOBILIARIO_TP_TR
('IMOBILIARIO_TP_TR', 'A', 801, 1000, 0.82, 10.30, 'Risco Excelente'),
('IMOBILIARIO_TP_TR', 'B', 601, 800, 0.92, 11.61, 'Risco Bom'),
('IMOBILIARIO_TP_TR', 'C', 401, 600, 1.05, 13.35, 'Risco Médio'),
('IMOBILIARIO_TP_TR', 'D', 201, 400, 1.25, 16.08, 'Risco Alto'),
('IMOBILIARIO_TP_TR', 'E', 0, 200, NULL, NULL, 'Reprovado por Risco')
AS novos_dados
ON DUPLICATE KEY UPDATE 
  score_min = novos_dados.score_min,
  score_max = novos_dados.score_max,
  taxa_mes = novos_dados.taxa_mes,
  taxa_ano = novos_dados.taxa_ano;