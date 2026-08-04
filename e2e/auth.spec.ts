import { expect, test } from "@playwright/test";

/**
 * Primeiro lote real de E2E (CRM-F0-08) - cobre só o que é verificável sem
 * usuário seedado/banco de teste dedicado: renderização do login, tratamento
 * de erro (sem crash) e o guard de rota autenticada. O fluxo crítico completo
 * de docs/QUALITY_AND_ACCEPTANCE.md §4 (login → oportunidade → proposta →
 * contrato → projeto → recebível → relatório) precisa de uma organização e
 * usuário de teste reais - fica para quando houver banco de teste disponível.
 */
test.describe("login", () => {
  test("renders the email, password and submit fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar no sistema" })).toBeVisible();
  });

  test("shows an error message on invalid credentials, without crashing", async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[type="email"]').fill("naoexiste@teste.com");
    await page.locator('input[type="password"]').fill("senhaerrada123");
    await page.getByRole("button", { name: "Entrar no sistema" }).click();

    await expect(page.locator("text=/Erro/")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("route guard", () => {
  for (const path of ["/crm/pipeline", "/crm/tarefas", "/crm/tarefas/calendario", "/dashboard"]) {
    test(`redirects unauthenticated access to ${path} back to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});
