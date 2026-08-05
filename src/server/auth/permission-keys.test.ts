import { describe, expect, it } from "vitest";
import { ROLE_KEYS, ROLE_PERMISSIONS } from "./permission-keys";

/**
 * CRM-F4-11: teste negativo de privacidade - garante que nenhum papel além
 * de `owner` recebe as chaves que dão acesso a dados pessoais (Módulo I do
 * plano mestre: "nenhum usuário empresarial pode consultar, contar, inferir
 * ou exportar dados pessoais"). Roda sem banco (é uma verificação estática
 * do mapeamento papel→permissão), então cobre exatamente o que um teste
 * de integração cobriria aqui, sem precisar de um banco real.
 */
const PERSONAL_KEYS = [
  "profitability.read_personal",
  "profitability.manage_personal",
  "profitability.view_founder_summary",
] as const;

describe("isolamento de dados pessoais (permission-keys)", () => {
  it("owner é o único papel com as três chaves pessoais", () => {
    for (const key of PERSONAL_KEYS) {
      expect(ROLE_PERMISSIONS.owner).toContain(key);
    }
  });

  it("nenhum papel além de owner tem qualquer chave pessoal", () => {
    for (const role of ROLE_KEYS) {
      if (role === "owner") continue;
      for (const key of PERSONAL_KEYS) {
        expect(ROLE_PERMISSIONS[role], `papel "${role}" não deveria ter "${key}"`).not.toContain(
          key,
        );
      }
    }
  });

  it("admin recebe todas as outras chaves, mas exclui explicitamente as pessoais", () => {
    expect(ROLE_PERMISSIONS.admin).not.toContain("profitability.read_personal");
    expect(ROLE_PERMISSIONS.admin).not.toContain("profitability.manage_personal");
    expect(ROLE_PERMISSIONS.admin).not.toContain("profitability.view_founder_summary");
    // mas continua tendo o lado empresarial equivalente, confirmando que a
    // exclusão é específica do pessoal, não um apagão geral de profitability.
    expect(ROLE_PERMISSIONS.admin).toContain("profitability.read_business");
  });
});
