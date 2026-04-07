-- ============================================================
-- Schema Supabase — Sistema de Certificados INQ  (v2)
-- Executar no SQL Editor do Supabase Dashboard
-- ============================================================

-- ENUM: tipos de utilizador
CREATE TYPE user_role AS ENUM ('admin', 'utilizador');

-- TABELA: utilizadores
CREATE TABLE IF NOT EXISTS utilizadores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'utilizador',
  ativo         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_utilizadores_email ON utilizadores(email);
CREATE INDEX IF NOT EXISTS idx_utilizadores_role  ON utilizadores(role);

-- TABELA: certificados
CREATE TABLE IF NOT EXISTS certificados (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_certificado TEXT NOT NULL UNIQUE,
  nome_formando      TEXT NOT NULL,
  curso              TEXT NOT NULL,
  data_emissao       DATE NOT NULL,
  data_validade      DATE,
  duracao            TEXT,
  instituicao        TEXT NOT NULL DEFAULT 'Instituto Nacional de Qualificações (INQ)',
  diretor            TEXT NOT NULL DEFAULT 'Edgarda Neto',
  cargo_dir          TEXT NOT NULL DEFAULT 'Diretora-Geral',
  qr_code_url        TEXT,
  emitido_por        UUID REFERENCES utilizadores(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificados_numero  ON certificados(numero_certificado);
CREATE INDEX IF NOT EXISTS idx_certificados_nome    ON certificados(nome_formando);
CREATE INDEX IF NOT EXISTS idx_certificados_created ON certificados(created_at DESC);

-- TRIGGER: updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER utilizadores_updated_at
  BEFORE UPDATE ON utilizadores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER certificados_updated_at
  BEFORE UPDATE ON certificados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ROW LEVEL SECURITY
ALTER TABLE utilizadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cert_leitura_publica" ON certificados FOR SELECT USING (true);
CREATE POLICY "cert_escrita_service" ON certificados FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "util_service_only"    ON utilizadores FOR ALL USING (auth.role() = 'service_role');

-- ADMIN INICIAL
-- Password padrão: AdminINQ2026 — TROCAR no painel após primeiro login!
-- Hash gerado com: node scripts/generate-hash.mjs AdminINQ2026
INSERT INTO utilizadores (nome, email, password_hash, role)
VALUES (
  'Administrador INQ',
  'admin@inq.ao',
  '$2b$10$Xdi8FFPHyj6W0BUcLW.Rze5m0dtnUc920x/sIqnnGOaVai30QbBoq',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- ── TABELA: cursos ─────────────────────────────────────────
-- Executar apenas esta parte se as tabelas anteriores já existem
CREATE TABLE IF NOT EXISTS cursos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                 TEXT NOT NULL UNIQUE,
  descricao            TEXT,
  conteudo_programatico TEXT,  -- texto longo, pode usar Markdown
  duracao_padrao       TEXT,
  ativo                BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cursos_nome  ON cursos(nome);
CREATE INDEX IF NOT EXISTS idx_cursos_ativo ON cursos(ativo);

CREATE TRIGGER cursos_updated_at
  BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cursos_leitura_publica" ON cursos FOR SELECT USING (true);
CREATE POLICY "cursos_escrita_service" ON cursos FOR ALL USING (auth.role() = 'service_role');

-- Adicionar referência de curso à tabela certificados
ALTER TABLE certificados ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL;

-- Cursos iniciais de exemplo
INSERT INTO cursos (nome, conteudo_programatico, duracao_padrao) VALUES
(
  'Metodologia de Abordagem por Competências',
  'Módulo 1 — Fundamentos das Competências
• Conceito de competência profissional
• Taxonomia de Bloom aplicada à formação
• Referenciais de qualificação nacionais

Módulo 2 — Design Curricular por Competências
• Identificação e mapeamento de competências
• Resultados de aprendizagem (RA)
• Critérios de desempenho e indicadores

Módulo 3 — Metodologias Activas de Formação
• Aprendizagem baseada em projectos (PBL)
• Estudos de caso e simulações
• Portefólio de evidências

Módulo 4 — Avaliação por Competências
• Instrumentos de avaliação
• Avaliação formativa e sumativa
• Feedback e melhoria contínua

Módulo 5 — Implementação e Boas Práticas
• Casos práticos nacionais e internacionais
• Reconhecimento e validação de competências (RVCC)
• Certificação e quadro nacional de qualificações (QNQ)',
  '40 horas'
),
(
  'Esteticista – Nível 3',
  'Módulo 1 — Higiene e Segurança em Estética
• Normas de higiene profissional
• Segurança no posto de trabalho
• Produtos e equipamentos

Módulo 2 — Cuidados de Pele
• Análise e diagnóstico da pele
• Técnicas de limpeza facial
• Tratamentos hidratantes e nutritivos

Módulo 3 — Técnicas de Maquilhagem
• Teoria da cor aplicada
• Maquilhagem social e de cerimónia
• Correcção e modelação

Módulo 4 — Depilação e Epilação
• Técnicas de depilação a cera
• Epilação a laser (noções básicas)
• Cuidados pós-tratamento

Módulo 5 — Massagem Facial e Corporal
• Técnicas de massagem clássica
• Drenagem linfática manual
• Aromoterapia aplicada',
  '600 horas'
),
(
  'Esteticista-Cosmetologista – Nível 4',
  'Módulo 1 — Cosmetologia Avançada
• Formulação e composição de cosméticos
• Legislação e regulamentação
• Testes de eficácia e segurança

Módulo 2 — Técnicas Estéticas Avançadas
• Peelings químicos e mecânicos
• Microagulhamento e bioestimulação
• Tratamentos anti-envelhecimento

Módulo 3 — Gestão do Espaço de Estética
• Gestão de stocks e fornecedores
• Atendimento e fidelização de clientes
• Marketing digital para estética

Módulo 4 — Inovação e Tecnologia em Estética
• Equipamentos de última geração
• Protocolos de tratamento
• Tendências internacionais

Módulo 5 — Estágio Profissional
• Prática supervisionada em salão
• Portfólio de casos clínicos
• Avaliação de competências práticas',
  '900 horas'
)
ON CONFLICT (nome) DO NOTHING;
