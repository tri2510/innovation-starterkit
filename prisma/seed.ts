import { PrismaClient } from "@prisma/client"
import { scrypt, randomBytes } from "crypto"
import { promisify } from "util"

const scryptAsync = promisify(scrypt)
const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64")
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer
  return `${derivedKey.toString("base64")}.${salt}`
}

async function main() {
  console.log("Start seeding...")

  // Create evaluation user
  const email = process.env.EVALUATION_USER_EMAIL || "evaluator@innovationkit.local"
  const password = process.env.EVALUATION_USER_PASSWORD || "Eval2025!"
  const name = "Evaluation User"

  // Hash password using scrypt (Better Auth compatible format)
  const hashedPassword = await hashPassword(password)

  // Create user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      emailVerified: true,
    },
  })

  // Create account with password
  await prisma.account.upsert({
    where: {
      id: user.id,
    },
    update: {
      password: hashedPassword,
    },
    create: {
      id: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
      userId: user.id,
    },
  })

  console.log("Seeding finished.")
  console.log(`Evaluation user created:`)
  console.log(`  Email: ${email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Name: ${name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
