/**
 * Single source of truth for permission keys and role→permission mapping,
 * per docs/ARCHITECTURE_AND_STANDARDS.md section 6 and docs/PRODUCT_VISION.md
 * section 4 (user profiles). Used both to seed the `permissions` /
 * `role_permissions` tables and to type-check every requirePermission() call.
 */

export const PERMISSION_KEYS = [
  "dashboard.read",

  // Not listed in docs/ARCHITECTURE_AND_STANDARDS.md section 6, but the
  // briefings module (docs/MODULE_SPECIFICATIONS.md section 3) clearly needs
  // its own permissions - added here following the same read/manage/review
  // shape used elsewhere in that list.
  "briefings.read",
  "briefings.manage_templates",
  "briefings.review",

  "companies.read",
  "companies.create",
  "companies.update",
  "companies.delete",
  "companies.restore",

  "contacts.read",
  "contacts.create",
  "contacts.update",
  "contacts.delete",
  "contacts.restore",

  "opportunities.read",
  "opportunities.create",
  "opportunities.update",
  "opportunities.move",
  "opportunities.win",
  "opportunities.lose",
  "opportunities.delete",

  "tasks.read",
  "tasks.create",
  "tasks.update",
  "tasks.complete",
  "tasks.delete",

  "products.read",
  "products.manage",

  "proposals.read",
  "proposals.create",
  "proposals.update",
  "proposals.publish",
  "proposals.send",
  "proposals.cancel",

  "contracts.read",
  "contracts.create",
  "contracts.update",
  "contracts.send",
  "contracts.sign",
  "contracts.cancel",

  "projects.read",
  "projects.create",
  "projects.update",
  "projects.complete",
  "projects.delete",

  "files.read",
  "files.upload",
  "files.delete",

  "approvals.read",
  "approvals.create",
  "approvals.decide",

  "finance.read",
  "finance.create",
  "finance.update",
  "finance.mark_paid",
  "finance.reverse",
  "finance.cancel",

  "profitability.read_business",
  "profitability.manage_business",
  "profitability.read_personal",
  "profitability.manage_personal",
  "profitability.view_founder_summary",

  "reports.read",
  "reports.finance",

  "members.read",
  "members.invite",
  "members.update",
  "members.remove",

  "settings.read",
  "settings.update",

  "audit.read",

  "integrations.manage",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const ROLE_KEYS = ["owner", "admin", "commercial", "projects", "finance", "viewer"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

const READ_ONLY_KEYS = PERMISSION_KEYS.filter(
  (key) =>
    key.endsWith(".read") || key === "dashboard.read" || key === "profitability.read_business",
);

/**
 * Role → permission mapping. `owner` gets every key (including personal
 * profitability data per docs/MODULE_SPECIFICATIONS.md section 13 - "acesso
 * exclusivo do fundador"). No other role gets profitability.*_personal or
 * profitability.view_founder_summary.
 *
 * This is a first-pass mapping based on the role descriptions in
 * docs/PRODUCT_VISION.md section 4 - refine as real usage clarifies edge
 * cases (e.g. whether commercial should be able to contracts.cancel).
 */
export const ROLE_PERMISSIONS: Record<RoleKey, readonly PermissionKey[]> = {
  owner: PERMISSION_KEYS,

  admin: PERMISSION_KEYS.filter(
    (key) =>
      key !== "profitability.read_personal" &&
      key !== "profitability.manage_personal" &&
      key !== "profitability.view_founder_summary",
  ),

  commercial: [
    "dashboard.read",
    "briefings.read",
    "briefings.review",
    "companies.read",
    "companies.create",
    "companies.update",
    "companies.restore",
    "contacts.read",
    "contacts.create",
    "contacts.update",
    "contacts.restore",
    "opportunities.read",
    "opportunities.create",
    "opportunities.update",
    "opportunities.move",
    "opportunities.win",
    "opportunities.lose",
    "tasks.read",
    "tasks.create",
    "tasks.update",
    "tasks.complete",
    "products.read",
    "proposals.read",
    "proposals.create",
    "proposals.update",
    "proposals.publish",
    "proposals.send",
    "contracts.read",
    "contracts.create",
    "contracts.update",
    "contracts.send",
    "reports.read",
  ],

  projects: [
    "dashboard.read",
    "opportunities.read",
    "tasks.read",
    "tasks.create",
    "tasks.update",
    "tasks.complete",
    "projects.read",
    "projects.create",
    "projects.update",
    "projects.complete",
    "files.read",
    "files.upload",
    "approvals.read",
    "approvals.create",
    "approvals.decide",
    "reports.read",
  ],

  finance: [
    "dashboard.read",
    "contracts.read",
    "contracts.update",
    "contracts.send",
    "contracts.cancel",
    "finance.read",
    "finance.create",
    "finance.update",
    "finance.mark_paid",
    "finance.reverse",
    "finance.cancel",
    "profitability.read_business",
    "profitability.manage_business",
    "reports.read",
    "reports.finance",
  ],

  viewer: READ_ONLY_KEYS,
};
