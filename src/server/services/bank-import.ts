import { csvToObjects } from "./csv";

export type BankStatementLine = {
  date: Date;
  description: string;
  amount: number;
  externalId?: string;
};

const CSV_COLUMN_ALIASES = {
  date: ["data", "date"],
  description: ["descricao", "descrição", "description", "historico", "histórico"],
  amount: ["valor", "amount"],
};

function findColumn(headers: string[], aliases: string[]): string | undefined {
  return headers.find((h) => aliases.includes(h.trim().toLowerCase()));
}

function parseStatementDate(raw: string): Date {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return new Date(trimmed);
  const brMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (brMatch) {
    return new Date(`${brMatch[3]}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`);
  }
  return new Date(trimmed);
}

/** Aceita tanto "1.234,56" (pt-BR) quanto "1234.56" (padrão internacional). */
function parseAmount(raw: string): number {
  const cleaned = raw.trim();
  if (!cleaned) return Number.NaN;
  if (/,\d{1,2}$/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, "").replace(",", "."));
  }
  return Number(cleaned.replace(/,/g, ""));
}

/** CRM-F3-08: layout esperado tem colunas data/descrição/valor (aceita
 * variações em português e inglês) - sem dependência nova, reaproveita
 * parseCsv/csvToObjects (F0). */
export function parseCsvStatement(text: string): BankStatementLine[] {
  const rows = csvToObjects(text);
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const dateColumn = findColumn(headers, CSV_COLUMN_ALIASES.date);
  const descriptionColumn = findColumn(headers, CSV_COLUMN_ALIASES.description);
  const amountColumn = findColumn(headers, CSV_COLUMN_ALIASES.amount);
  if (!dateColumn || !amountColumn) {
    throw new Error("O CSV precisa ter colunas de data e valor (ex.: data,descricao,valor).");
  }

  return rows
    .map((row) => ({
      date: parseStatementDate(row[dateColumn]),
      description: descriptionColumn ? row[descriptionColumn] : "Lançamento importado",
      amount: parseAmount(row[amountColumn]),
    }))
    .filter((line) => !Number.isNaN(line.amount) && !Number.isNaN(line.date.getTime()));
}

/** CRM-F3-08: parser mínimo de OFX (SGML, não XML estrito) - extrai só os
 * campos usados pela conciliação (data, valor, descrição, FITID para
 * deduplicação de reimportação). */
export function parseOfxStatement(text: string): BankStatementLine[] {
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const lines: BankStatementLine[] = [];

  for (const block of blocks) {
    const body = block.split(/<\/STMTTRN>/i)[0];
    const dtPosted = /<DTPOSTED>([^<\r\n]+)/i.exec(body)?.[1]?.trim();
    const trnAmt = /<TRNAMT>([^<\r\n]+)/i.exec(body)?.[1]?.trim();
    if (!dtPosted || !trnAmt) continue;

    const fitId = /<FITID>([^<\r\n]+)/i.exec(body)?.[1]?.trim();
    const name = /<NAME>([^<\r\n]+)/i.exec(body)?.[1]?.trim();
    const memo = /<MEMO>([^<\r\n]+)/i.exec(body)?.[1]?.trim();

    const year = dtPosted.slice(0, 4);
    const month = dtPosted.slice(4, 6);
    const day = dtPosted.slice(6, 8);

    lines.push({
      date: new Date(`${year}-${month}-${day}`),
      description: name || memo || "Lançamento OFX",
      amount: parseAmount(trnAmt),
      externalId: fitId,
    });
  }

  return lines.filter((line) => !Number.isNaN(line.amount) && !Number.isNaN(line.date.getTime()));
}
