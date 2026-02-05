import { NextRequest, NextResponse } from "next/server"
import { createEvaluationSession } from "@/lib/evaluation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Code is required" },
        { status: 400 }
      )
    }

    const success = await createEvaluationSession(code)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid code" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    )
  }
}
