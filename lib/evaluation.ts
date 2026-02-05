import { cookies } from "next/headers"

export const EVALUATION_CODE = "EVALUATOR@2026"
const SESSION_COOKIE_NAME = "evaluation_session"
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export async function createEvaluationSession(code: string): Promise<boolean> {
  if (code !== EVALUATION_CODE) {
    return false
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: "/",
  })

  return true
}

export async function verifyEvaluationSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionCode = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCode) {
    return false
  }

  return sessionCode.value === EVALUATION_CODE
}

export async function clearEvaluationSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
