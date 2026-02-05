import { cookies } from "next/headers"

export const EVALUATION_CODE = "evaluator@2026"
const SESSION_COOKIE_NAME = "evaluation_session"

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
