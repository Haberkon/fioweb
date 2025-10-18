import { NextResponse } from "next/server";
import simulateTracking from "@/scripts/simulate-tracking";

export async function POST() {
  await simulateTracking();
  return NextResponse.json({ ok: true });
}
