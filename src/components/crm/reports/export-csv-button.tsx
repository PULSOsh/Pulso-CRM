"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { exportCommercialReportCsv, exportFinancialReportCsv } from "@/server/actions/reports";

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportCsvButton({
  report,
  days,
}: {
  report: "commercial" | "financial";
  days: number;
}) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const csv =
        report === "commercial"
          ? await exportCommercialReportCsv(days)
          : await exportFinancialReportCsv(days);
      downloadCsv(csv, `relatorio-${report}-${days}dias.csv`);
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={handleExport} disabled={isPending}>
      Baixar CSV
    </Button>
  );
}
