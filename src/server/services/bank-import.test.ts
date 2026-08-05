import { describe, expect, it } from "vitest";
import { parseCsvStatement, parseOfxStatement } from "./bank-import";

describe("parseCsvStatement", () => {
  it("lê data, descrição e valor em pt-BR", () => {
    const csv = 'data,descricao,valor\n05/09/2026,Pagamento cliente,"1.234,56"\n';
    const lines = parseCsvStatement(csv);
    expect(lines).toHaveLength(1);
    expect(lines[0].amount).toBeCloseTo(1234.56);
    expect(lines[0].description).toBe("Pagamento cliente");
    expect(lines[0].date.toISOString().slice(0, 10)).toBe("2026-09-05");
  });

  it("aceita cabeçalho em inglês", () => {
    const csv = "date,description,amount\n2026-09-05,Vendor payment,-200.50\n";
    const lines = parseCsvStatement(csv);
    expect(lines).toHaveLength(1);
    expect(lines[0].amount).toBeCloseTo(-200.5);
  });

  it("lança erro sem coluna de data/valor", () => {
    const csv = "foo,bar\n1,2\n";
    expect(() => parseCsvStatement(csv)).toThrow();
  });
});

describe("parseOfxStatement", () => {
  it("extrai transações de um bloco OFX mínimo", () => {
    const ofx = `
      <STMTTRN>
        <TRNTYPE>DEBIT
        <DTPOSTED>20260905
        <TRNAMT>-150.00
        <FITID>ABC123
        <NAME>Fornecedor XYZ
      </STMTTRN>
    `;
    const lines = parseOfxStatement(ofx);
    expect(lines).toHaveLength(1);
    expect(lines[0].amount).toBeCloseTo(-150);
    expect(lines[0].externalId).toBe("ABC123");
    expect(lines[0].description).toBe("Fornecedor XYZ");
  });

  it("ignora blocos sem data ou valor", () => {
    const ofx = "<STMTTRN><FITID>X</STMTTRN>";
    expect(parseOfxStatement(ofx)).toHaveLength(0);
  });
});
