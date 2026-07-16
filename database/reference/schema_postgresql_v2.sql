-- PULSO CRM — Modelo de dados PostgreSQL v2.0
-- Inclui o schema original e a extensão de briefings públicos e orçamentos em site.
-- Observação: a camada de autenticação poderá ser integrada ao Better Auth.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE member_status AS ENUM ('invited', 'active', 'suspended', 'removed');
CREATE TYPE opportunity_status AS ENUM ('open', 'won', 'lost', 'archived');
CREATE TYPE activity_type AS ENUM (
  'note', 'call', 'whatsapp', 'email', 'meeting', 'task', 'stage_change',
  'proposal', 'contract', 'payment', 'file', 'system'
);
CREATE TYPE task_status AS ENUM ('todo', 'doing', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'cancelled');
CREATE TYPE contract_status AS ENUM ('draft', 'sent', 'signed', 'cancelled', 'ended');
CREATE TYPE project_status AS ENUM ('planned', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE installment_status AS ENUM ('pending', 'due_soon', 'paid', 'overdue', 'cancelled');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'whatsapp', 'webhook');

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  slug varchar(80) NOT NULL UNIQUE,
  legal_name varchar(200),
  document_type varchar(20),
  document_number varchar(32),
  email citext,
  phone varchar(32),
  website varchar(255),
  timezone varchar(80) NOT NULL DEFAULT 'America/Fortaleza',
  currency char(3) NOT NULL DEFAULT 'BRL',
  locale varchar(16) NOT NULL DEFAULT 'pt-BR',
  logo_url text,
  primary_color varchar(16) DEFAULT '#E65318',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  email citext NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  avatar_url text,
  phone varchar(32),
  locale varchar(16) NOT NULL DEFAULT 'pt-BR',
  timezone varchar(80) NOT NULL DEFAULT 'America/Fortaleza',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL,
  key varchar(80) NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, key)
);

CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(120) NOT NULL UNIQUE,
  module varchar(80) NOT NULL,
  action varchar(40) NOT NULL,
  description text
);

CREATE TABLE role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  status member_status NOT NULL DEFAULT 'invited',
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  trade_name varchar(180) NOT NULL,
  legal_name varchar(220),
  document_number varchar(32),
  segment varchar(120),
  email citext,
  phone varchar(32),
  website varchar(255),
  instagram varchar(120),
  address_line varchar(240),
  address_number varchar(40),
  district varchar(120),
  city varchar(120),
  state char(2),
  postal_code varchar(16),
  country char(2) NOT NULL DEFAULT 'BR',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX companies_org_name_idx ON companies (organization_id, trade_name);
CREATE INDEX companies_org_document_idx ON companies (organization_id, document_number);

CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  first_name varchar(100) NOT NULL,
  last_name varchar(120),
  email citext,
  phone varchar(32),
  whatsapp varchar(32),
  job_title varchar(120),
  document_number varchar(32),
  instagram varchar(120),
  origin varchar(120),
  preferred_channel varchar(40),
  birth_date date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX contacts_org_name_idx ON contacts (organization_id, first_name, last_name);
CREATE INDEX contacts_org_email_idx ON contacts (organization_id, email);
CREATE INDEX contacts_org_phone_idx ON contacts (organization_id, phone);

CREATE TABLE company_contacts (
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  relationship varchar(120),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, contact_id)
);

CREATE TABLE pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  color varchar(16),
  position integer NOT NULL,
  probability smallint NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  is_won boolean NOT NULL DEFAULT false,
  is_lost boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pipeline_id, position)
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(180) NOT NULL,
  slug varchar(160),
  category varchar(120),
  description text,
  base_price numeric(14,2) NOT NULL DEFAULT 0,
  pricing_unit varchar(40) NOT NULL DEFAULT 'project',
  average_delivery_days integer,
  scope_default text,
  terms_default text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
  stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  primary_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title varchar(220) NOT NULL,
  description text,
  source varchar(120),
  status opportunity_status NOT NULL DEFAULT 'open',
  temperature varchar(24) DEFAULT 'warm',
  estimated_value numeric(14,2) NOT NULL DEFAULT 0,
  negotiated_value numeric(14,2),
  probability smallint CHECK (probability BETWEEN 0 AND 100),
  expected_close_date date,
  next_action_at timestamptz,
  next_action_description varchar(240),
  lost_reason varchar(180),
  won_at timestamptz,
  lost_at timestamptz,
  position numeric(18,8) NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX opportunities_org_pipeline_stage_idx ON opportunities (organization_id, pipeline_id, stage_id, position);
CREATE INDEX opportunities_owner_next_action_idx ON opportunities (owner_user_id, next_action_at);
CREATE INDEX opportunities_org_status_idx ON opportunities (organization_id, status);

CREATE TABLE opportunity_products (
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  PRIMARY KEY (opportunity_id, product_id)
);

CREATE TABLE opportunity_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  from_stage_id uuid REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  to_stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  moved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL,
  color varchar(16),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE entity_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type varchar(40) NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tag_id, entity_type, entity_id)
);

CREATE INDEX entity_tags_lookup_idx ON entity_tags (organization_id, entity_type, entity_id);

CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  title varchar(220),
  body text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activities_opportunity_timeline_idx ON activities (opportunity_id, occurred_at DESC);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  project_id uuid,
  title varchar(220) NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'normal',
  due_at timestamptz,
  completed_at timestamptz,
  reminder_at timestamptz,
  recurrence_rule text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_assignee_due_idx ON tasks (assigned_to, status, due_at);

CREATE TABLE proposal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(180) NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  template_id uuid REFERENCES proposal_templates(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  code varchar(40) NOT NULL,
  title varchar(220) NOT NULL,
  status proposal_status NOT NULL DEFAULT 'draft',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  valid_until date,
  public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  public_access_enabled boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  first_viewed_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code),
  UNIQUE (public_token)
);

CREATE TABLE proposal_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title varchar(220) NOT NULL,
  scope text,
  terms text,
  notes text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, version_number)
);

CREATE TABLE proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_version_id uuid NOT NULL REFERENCES proposal_versions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  description varchar(240) NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0
);

CREATE TABLE proposal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  event_type varchar(60) NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(180) NOT NULL,
  category varchar(120),
  content text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL,
  template_id uuid REFERENCES contract_templates(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  code varchar(40) NOT NULL,
  title varchar(220) NOT NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  content text NOT NULL,
  public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  public_access_enabled boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  signed_at timestamptz,
  signer_name varchar(180),
  signer_document varchar(32),
  signer_ip inet,
  signer_user_agent text,
  signature_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code),
  UNIQUE (public_token)
);

CREATE TABLE contract_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event_type varchar(60) NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  position integer NOT NULL,
  color varchar(16),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (organization_id, position)
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  primary_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES project_stages(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name varchar(220) NOT NULL,
  description text,
  status project_status NOT NULL DEFAULT 'planned',
  total_value numeric(14,2) NOT NULL DEFAULT 0,
  start_date date,
  due_date date,
  completed_at timestamptz,
  progress smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  production_url text,
  published_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ADD CONSTRAINT tasks_project_fk FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

CREATE TABLE project_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title varchar(220) NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title varchar(220) NOT NULL,
  description text,
  status varchar(40) NOT NULL DEFAULT 'pending',
  public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by_name varchar(180),
  decision_notes text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (public_token)
);

CREATE TABLE financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(140) NOT NULL,
  account_type varchar(60),
  institution varchar(120),
  pix_key_type varchar(30),
  pix_key_masked varchar(120),
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  description varchar(220) NOT NULL,
  total_amount numeric(14,2) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id uuid NOT NULL REFERENCES receivables(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount numeric(14,2) NOT NULL,
  due_date date NOT NULL,
  status installment_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  paid_amount numeric(14,2),
  payment_method varchar(80),
  account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (receivable_id, installment_number)
);

CREATE INDEX installments_due_status_idx ON installments (status, due_date);

CREATE TABLE stored_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  storage_provider varchar(40) NOT NULL DEFAULT 's3',
  bucket varchar(120),
  object_key text NOT NULL,
  original_name varchar(255) NOT NULL,
  mime_type varchar(160),
  size_bytes bigint,
  checksum_sha256 varchar(64),
  is_private boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES stored_files(id) ON DELETE CASCADE,
  entity_type varchar(40) NOT NULL,
  entity_id uuid NOT NULL,
  label varchar(120),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX attachments_entity_idx ON attachments (organization_id, entity_type, entity_id);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  type varchar(80) NOT NULL,
  title varchar(220) NOT NULL,
  body text,
  action_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx ON notifications (user_id, read_at, created_at DESC);

CREATE TABLE integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider varchar(80) NOT NULL,
  name varchar(140) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'inactive',
  credentials_encrypted text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organization_settings (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(120) NOT NULL,
  entity_type varchar(80),
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_org_created_idx ON audit_logs (organization_id, created_at DESC);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);

-- Função genérica de updated_at.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'organizations','users','organization_members','companies','contacts','pipelines',
    'pipeline_stages','products','opportunities','tasks','proposal_templates','proposals',
    'contracts','projects','receivables','installments','integration_connections'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_set_updated_at ON %I', table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      table_name, table_name
    );
  END LOOP;
END $$;

-- Pipeline padrão sugerido (executar após criar a organização).
-- Novo contato → Qualificação → Diagnóstico → Proposta enviada → Negociação → Fechado → Perdido

-- PULSO CRM V2 — Migração conceitual: briefings públicos e orçamentos em site.
-- Aplicar somente depois de revisar a migração gerada pelo ORM no ambiente real.

CREATE TYPE briefing_template_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE briefing_submission_status AS ENUM (
  'started', 'submitted', 'under_review', 'qualified', 'linked',
  'proposal_created', 'archived', 'spam'
);
CREATE TYPE proposal_response_type AS ENUM ('accepted', 'rejected', 'changes_requested');
CREATE TYPE field_origin_type AS ENUM ('briefing', 'crm', 'manual', 'product_catalog', 'ai_suggestion', 'system');

-- Permite que um orçamento manual seja criado antes da oportunidade. A aplicação pode
-- criar a oportunidade durante o fluxo, mas o banco não força esse acoplamento.
ALTER TABLE proposals ALTER COLUMN opportunity_id DROP NOT NULL;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS source_type varchar(40) NOT NULL DEFAULT 'manual';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS source_id uuid;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS current_version_id uuid;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS public_slug varchar(120);

CREATE TABLE briefing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  default_pipeline_id uuid REFERENCES pipelines(id) ON DELETE SET NULL,
  default_stage_id uuid REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  default_owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name varchar(180) NOT NULL,
  slug varchar(140) NOT NULL,
  public_title varchar(220) NOT NULL,
  public_description text,
  success_title varchar(220),
  success_message text,
  status briefing_template_status NOT NULL DEFAULT 'draft',
  create_opportunity_on_submit boolean NOT NULL DEFAULT true,
  require_contact_email boolean NOT NULL DEFAULT true,
  allow_resume boolean NOT NULL DEFAULT true,
  allow_attachments boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_version_id uuid,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  UNIQUE (organization_id, slug)
);

CREATE TABLE briefing_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES briefing_templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  schema_version integer NOT NULL DEFAULT 1,
  snapshot jsonb NOT NULL,
  published_at timestamptz,
  published_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version_number)
);

ALTER TABLE briefing_templates
  ADD CONSTRAINT briefing_templates_published_version_fk
  FOREIGN KEY (published_version_id) REFERENCES briefing_template_versions(id) ON DELETE SET NULL;

CREATE TABLE briefing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id uuid NOT NULL REFERENCES briefing_template_versions(id) ON DELETE CASCADE,
  stable_key varchar(120) NOT NULL,
  title varchar(220) NOT NULL,
  description text,
  position integer NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (template_version_id, stable_key),
  UNIQUE (template_version_id, position)
);

CREATE TABLE briefing_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES briefing_sections(id) ON DELETE CASCADE,
  stable_key varchar(120) NOT NULL,
  question_type varchar(40) NOT NULL,
  title varchar(320) NOT NULL,
  help_text text,
  placeholder varchar(240),
  is_required boolean NOT NULL DEFAULT false,
  is_sensitive boolean NOT NULL DEFAULT false,
  can_use_in_proposal boolean NOT NULL DEFAULT false,
  can_display_publicly boolean NOT NULL DEFAULT false,
  crm_mapping_key varchar(120),
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL,
  UNIQUE (section_id, stable_key),
  UNIQUE (section_id, position)
);

CREATE TABLE briefing_question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES briefing_questions(id) ON DELETE CASCADE,
  value varchar(160) NOT NULL,
  label varchar(220) NOT NULL,
  description text,
  position integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (question_id, value),
  UNIQUE (question_id, position)
);

CREATE TABLE briefing_logic_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id uuid NOT NULL REFERENCES briefing_template_versions(id) ON DELETE CASCADE,
  target_question_id uuid REFERENCES briefing_questions(id) ON DELETE CASCADE,
  target_section_id uuid REFERENCES briefing_sections(id) ON DELETE CASCADE,
  action varchar(30) NOT NULL DEFAULT 'show',
  conditions jsonb NOT NULL,
  position integer NOT NULL DEFAULT 0,
  CHECK (target_question_id IS NOT NULL OR target_section_id IS NOT NULL)
);

CREATE TABLE briefing_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES briefing_templates(id) ON DELETE RESTRICT,
  template_version_id uuid NOT NULL REFERENCES briefing_template_versions(id) ON DELETE RESTRICT,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  protocol varchar(40) NOT NULL,
  status briefing_submission_status NOT NULL DEFAULT 'started',
  source varchar(80) NOT NULL DEFAULT 'public_site',
  contact_name varchar(180),
  contact_email citext,
  contact_phone varchar(32),
  company_name varchar(220),
  completion_percent smallint NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
  template_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  qualified_at timestamptz,
  linked_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, protocol)
);

CREATE INDEX briefing_submissions_inbox_idx
  ON briefing_submissions (organization_id, status, submitted_at DESC NULLS LAST, created_at DESC);
CREATE INDEX briefing_submissions_email_idx
  ON briefing_submissions (organization_id, contact_email);

CREATE TABLE briefing_submission_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES briefing_submissions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES briefing_questions(id) ON DELETE RESTRICT,
  question_key varchar(120) NOT NULL,
  value jsonb NOT NULL,
  normalized_text text,
  is_visible_by_logic boolean NOT NULL DEFAULT true,
  source field_origin_type NOT NULL DEFAULT 'briefing',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, question_id)
);

CREATE INDEX briefing_answers_submission_idx ON briefing_submission_answers (submission_id);

CREATE TABLE briefing_resume_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES briefing_submissions(id) ON DELETE CASCADE,
  token_hash varchar(128) NOT NULL UNIQUE,
  sent_to citext,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES briefing_submissions(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL,
  consent_key varchar(120) NOT NULL,
  purpose varchar(220) NOT NULL,
  text_version varchar(40) NOT NULL,
  text_snapshot text NOT NULL,
  granted boolean NOT NULL,
  ip_address inet,
  user_agent text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE proposal_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_version_id uuid NOT NULL REFERENCES proposal_versions(id) ON DELETE CASCADE,
  block_type varchar(60) NOT NULL,
  stable_key varchar(120) NOT NULL,
  title varchar(240),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  position integer NOT NULL,
  source field_origin_type NOT NULL DEFAULT 'manual',
  source_reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_version_id, stable_key),
  UNIQUE (proposal_version_id, position)
);

CREATE TABLE proposal_payment_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_version_id uuid NOT NULL REFERENCES proposal_versions(id) ON DELETE CASCADE,
  name varchar(180) NOT NULL,
  description text,
  entry_amount numeric(14,2) NOT NULL DEFAULT 0,
  installment_count integer NOT NULL DEFAULT 1 CHECK (installment_count > 0),
  installment_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE proposal_public_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  proposal_version_id uuid NOT NULL REFERENCES proposal_versions(id) ON DELETE RESTRICT,
  token_hash varchar(128) NOT NULL UNIQUE,
  public_token_prefix varchar(20) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  revoked_at timestamptz,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX proposal_public_links_active_idx
  ON proposal_public_links (proposal_id, is_active, created_at DESC);

CREATE TABLE proposal_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  proposal_version_id uuid NOT NULL REFERENCES proposal_versions(id) ON DELETE RESTRICT,
  public_link_id uuid REFERENCES proposal_public_links(id) ON DELETE SET NULL,
  response_type proposal_response_type NOT NULL,
  signer_name varchar(180),
  signer_email citext,
  signer_role varchar(160),
  message text,
  payment_option_id uuid REFERENCES proposal_payment_options(id) ON DELETE SET NULL,
  snapshot_hash varchar(128) NOT NULL,
  ip_address inet,
  user_agent text,
  idempotency_key varchar(128),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, idempotency_key)
);

CREATE TABLE proposal_selected_addons (
  response_id uuid NOT NULL REFERENCES proposal_responses(id) ON DELETE CASCADE,
  proposal_item_id uuid NOT NULL REFERENCES proposal_items(id) ON DELETE RESTRICT,
  selected boolean NOT NULL DEFAULT true,
  amount_snapshot numeric(14,2) NOT NULL,
  PRIMARY KEY (response_id, proposal_item_id)
);

CREATE TABLE idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  scope varchar(120) NOT NULL,
  key_hash varchar(128) NOT NULL,
  request_hash varchar(128),
  response_status integer,
  response_body jsonb,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, key_hash)
);

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  event_type varchar(160) NOT NULL,
  aggregate_type varchar(100) NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text
);

CREATE INDEX outbox_events_pending_idx
  ON outbox_events (processed_at, available_at) WHERE processed_at IS NULL;

-- FK adicionada depois de proposal_versions existir.
ALTER TABLE proposals
  ADD CONSTRAINT proposals_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES proposal_versions(id) ON DELETE SET NULL;

-- Triggers de updated_at para as novas tabelas mutáveis.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'briefing_templates', 'briefing_submissions', 'briefing_submission_answers'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_set_updated_at ON %I', table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      table_name, table_name
    );
  END LOOP;
END $$;
