import { NextResponse } from "next/server";

export async function GET() {
  const pdfText = [
    "---------------------------------------------",
    "         FIXORA PLATFORM TELEMETRY REPORT    ",
    "---------------------------------------------",
    "Generated at: " + new Date().toISOString(),
    "",
    "Performance Summary:",
    "  Total Users: 28",
    "  Active Complaints: 5",
    "  Settle Revenue: ₹14,500 INR",
    "",
    "Diagnostics Insights:",
    "  Drivetrain Bearings: Critical",
    "  Brake Skimming: Medium",
    "---------------------------------------------"
  ].join("\n");

  return new Response(pdfText, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": "attachment; filename=fixora_telemetry_report.pdf",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
