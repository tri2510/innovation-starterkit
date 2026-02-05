import { NextRequest, NextResponse } from "next/server"
import { verifyEvaluationSession } from "./lib/evaluation"

export async function proxy(request: NextRequest) {
  const isEvaluationPage = request.nextUrl.pathname.startsWith("/evaluation")
  const isRootRoute = request.nextUrl.pathname === "/"

  // Allow access to evaluation page and root route
  if (isEvaluationPage || isRootRoute) {
    return NextResponse.next()
  }

  // Verify session for all other routes
  const isAuthenticated = await verifyEvaluationSession()

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/evaluation", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
