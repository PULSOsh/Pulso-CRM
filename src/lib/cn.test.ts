import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("combina classes", () => expect(cn("px-2", "px-6")).toBe("px-6"));
});
