import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  // Get session using Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isRootRoute = request.nextUrl.pathname === "/"

  // If not authenticated and trying to access protected route
  if (!session && !isAuthPage && !isRootRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If authenticated and trying to access login page
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/challenge", request.url))
  }

  return NextResponse.next()
}

// Configure which routes the proxy should run on
export const config = {
  matcher: [
    // Skip static files and API auth routes
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
