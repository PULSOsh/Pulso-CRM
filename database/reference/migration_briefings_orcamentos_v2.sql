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
