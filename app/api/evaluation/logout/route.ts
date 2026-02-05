import { NextResponse } from "next/server"
import { clearEvaluationSession } from "@/lib/evaluation"

export async function POST() {
  await clearEvaluationSession()

  return NextResponse.json({ success: true })
}
