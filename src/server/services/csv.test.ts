import { describe, expect, it } from "vitest";
import { csvToObjects, parseCsv, toCsv } from "./csv";

describe("toCsv", () => {
  it("gera cabeçalho e linhas a partir de objetos", () => {
    expect(
      toCsv([
        { a: 1, b: "x" },
        { a: 2, b: "y" },
      ]),
    ).toBe("a,b\r\n1,x\r\n2,y");
  });

  it("coloca entre aspas valores com vírgula", () => {
    expect(toCsv([{ nome: "Silva, João" }])).toBe('nome\r\n"Silva, João"');
  });

  it("retorna string vazia para lista vazia", () => {
    expect(toCsv([])).toBe("");
  });

  it("é o inverso de csvToObjects para dados simples", () => {
    const original = [{ nome: "Ana", cidade: "Recife" }];
    const csv = toCsv(original);
    expect(csvToObjects(csv)).toEqual(original.map((r) => ({ nome: r.nome, cidade: r.cidade })));
  });
});

describe("parseCsv", () => {
  it("faz parse de linhas simples separadas por vírgula", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("respeita campo entre aspas contendo vírgula", () => {
    expect(parseCsv('nome,cidade\n"Silva, João",Fortaleza')).toEqual([
      ["nome", "cidade"],
      ["Silva, João", "Fortaleza"],
    ]);
  });

  it('resolve aspas escapadas ("") dentro de campo entre aspas', () => {
    expect(parseCsv('a\n"disse ""oi"""')).toEqual([["a"], ['disse "oi"']]);
  });

  it("aceita CRLF e LF misturados", () => {
    expect(parseCsv("a,b\r\n1,2\n3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("aceita campo entre aspas com quebra de linha embutida", () => {
    expect(parseCsv('a\n"linha1\nlinha2"')).toEqual([["a"], ["linha1\nlinha2"]]);
  });

  it("ignora linhas totalmente vazias no fim do arquivo", () => {
    expect(parseCsv("a,b\n1,2\n\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("retorna vazio para texto vazio", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("csvToObjects", () => {
  it("mapeia linhas pro cabeçalho", () => {
    expect(csvToObjects("nome,email\nAna,ana@ex.com\nBia,bia@ex.com")).toEqual([
      { nome: "Ana", email: "ana@ex.com" },
      { nome: "Bia", email: "bia@ex.com" },
    ]);
  });

  it("preenche vazio quando a linha tem menos colunas que o cabeçalho", () => {
    expect(csvToObjects("nome,email,telefone\nAna,ana@ex.com")).toEqual([
      { nome: "Ana", email: "ana@ex.com", telefone: "" },
    ]);
  });

  it("retorna vazio quando só há cabeçalho", () => {
    expect(csvToObjects("nome,email")).toEqual([]);
  });
});
