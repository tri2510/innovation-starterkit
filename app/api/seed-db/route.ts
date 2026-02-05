import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { scrypt, randomBytes } from "crypto"
import { promisify } from "util"

const scryptAsync = promisify(scrypt)

// Simple password validation to prevent abuse
const VALIDATION_KEY = process.env.SEED_VALIDATION_KEY || "seed-the-db-2025"

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64")
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer
  return `${derivedKey.toString("base64")}.${salt}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key } = body

    // Validate the request has the correct key
    if (key !== VALIDATION_KEY) {
      return NextResponse.json(
        { error: "Invalid validation key" },
        { status: 403 }
      )
    }

    const prisma = new PrismaClient()

    // Create evaluation user
    const email = process.env.EVALUATION_USER_EMAIL || "evaluator@innovationkit.local"
    const password = process.env.EVALUATION_USER_PASSWORD || "Eval2025!"
    const name = "Evaluation User"

    const hashedPassword = await hashPassword(password)

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        emailVerified: true,
      },
    })

    // Create or update account with password
    await prisma.account.upsert({
      where: { id: user.id },
      update: { password: hashedPassword },
      create: {
        id: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
        userId: user.id,
      },
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      user: {
        email,
        name,
      },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      {
        error: "Failed to seed database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Allow GET to check if endpoint exists
export async function GET() {
  return NextResponse.json({
    message: "Seed endpoint is ready. Send POST request with { key: 'seed-the-db-2025' } to seed the database.",
  })
}
