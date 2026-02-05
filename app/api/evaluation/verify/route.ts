import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const EVALUATION_CODE = "EVALUATOR@2026"
const SESSION_COOKIE_NAME = "evaluation_session"
const SESSION_DURATION = 24 * 60 * 60 // 24 hours in seconds

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

    // Verify the code
    if (code !== EVALUATION_CODE) {
      return NextResponse.json(
        { success: false, error: "Invalid code" },
        { status: 401 }
      )
    }

    // Set the session cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    )
  }
}
