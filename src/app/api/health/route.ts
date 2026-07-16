import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "pulso-frontend-starter",
    timestamp: new Date().toISOString(),
  });
}
