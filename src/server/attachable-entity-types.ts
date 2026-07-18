export const ATTACHABLE_ENTITY_TYPES = [
  "contact",
  "company",
  "opportunity",
  "briefing",
  "proposal",
  "contract",
  "project",
  "approval",
  "receivable",
  "installment",
  "expense",
] as const;

export type AttachableEntityType = (typeof ATTACHABLE_ENTITY_TYPES)[number];
