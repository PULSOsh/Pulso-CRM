import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("é acessível", () => {
    render(<Button>Construir</Button>);
    expect(screen.getByRole("button", { name: "Construir" })).toBeInTheDocument();
  });
});
