import { createAuthClient } from "better-auth/react"

// Use production URL from env or fallback to localhost for development
// In production, we need to use the actual domain
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // Browser: use current origin
    return window.location.origin
  }
  // Server: use env var or localhost
  return process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
})

export const { signIn, signOut, signUp, useSession } = authClient
