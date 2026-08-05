import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("remove acentos e usa minúsculas", () => {
    expect(slugify("Como configurar a integração?")).toBe("como-configurar-a-integracao");
  });

  it("colapsa espaços e pontuação em um único hífen", () => {
    expect(slugify("São  Paulo -- SP!!")).toBe("sao-paulo-sp");
  });

  it("remove hífens nas extremidades", () => {
    expect(slugify("  título  ")).toBe("titulo");
  });
});
