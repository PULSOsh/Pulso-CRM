import { describe, expect, it } from "vitest";
import { isAuthorizedPersonalOwner } from "./personal-workspace";

describe("isAuthorizedPersonalOwner", () => {
  it("autoriza quando o usuário é exatamente o dono fixado", () => {
    expect(isAuthorizedPersonalOwner({ ownerUserId: "user-1" }, "user-1")).toBe(true);
  });

  it("rejeita outro usuário mesmo com papel owner (proteção contra segundo owner)", () => {
    expect(isAuthorizedPersonalOwner({ ownerUserId: "user-1" }, "user-2")).toBe(false);
  });

  it("rejeita quando o espaço pessoal ainda não foi ativado", () => {
    expect(isAuthorizedPersonalOwner(null, "user-1")).toBe(false);
    expect(isAuthorizedPersonalOwner(undefined, "user-1")).toBe(false);
  });
});
