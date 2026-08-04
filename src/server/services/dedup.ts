/**
 * Normalização pura pra comparação de duplicidade (CRM-F1-01). As colunas
 * `contacts_org_email_idx`/`contacts_org_phone_idx`/`companies_org_document_idx`
 * já existiam no schema desde a fundação, prontas exatamente pra isso, sem
 * nenhum código consultando por duplicidade antes desta story.
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

export function normalizeDigits(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, "");
  return digits ? digits : null;
}
