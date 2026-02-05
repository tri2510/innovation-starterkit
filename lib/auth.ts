import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user }: any) => {
      // For evaluation purposes, log to console instead of sending email
      console.log("Password reset requested:", { user })
    },
    sendVerificationEmail: async ({ user }: any) => {
      // For evaluation purposes, log to console instead of sending email
      console.log("Email verification:", { user })
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  socialProviders: {},
})

export type Session = typeof auth.$Infer.Session
