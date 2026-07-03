import { NextResponse } from "next/server";

export async function GET() {
  const csvData = [
    "Metric,Value",
    "Total Users,28",
    "Owners,22",
    "Workshops,6",
    "Active Complaints,5",
    "Revenue,₹14500"
  ].join("\n");

  return new Response(csvData, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=fixora_telemetry_report.csv",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
