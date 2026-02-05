# Authentication Setup Guide

This document explains how the authentication system works in the Innovation Kit and how to set it up for development and production.

## Overview

The Innovation Kit uses **Better Auth** for authentication - a modern, type-safe authentication library designed for Next.js 16+.

### Features
- ✅ Email/password authentication
- ✅ Protected routes with automatic redirect
- ✅ SQLite database (easily upgradable to PostgreSQL)
- ✅ Session management (30-day expiry)
- ✅ Future-ready for SSO (OAuth providers)

## Tech Stack

| Component | Library | Version |
|-----------|---------|---------|
| Authentication | Better Auth | ^1.4.18 |
| Database ORM | Prisma | ^6.19.2 |
| Database | SQLite (dev) / PostgreSQL (prod recommended) | - |
| Runtime | Node.js | 20.9.0+ |

## Quick Start

### 1. Environment Variables

Copy the required environment variables to your `.env` file:

```bash
# Database
DATABASE_URL="file:./dev.db"

# Authentication
EVALUATION_USER_EMAIL=evaluator@innovationkit.local
EVALUATION_USER_PASSWORD=Eval2025!
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma db push

# Seed evaluation user
DATABASE_URL="file:./dev.db" npx tsx prisma/seed.ts
```

### 3. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 and you'll be redirected to the login page.

## Default Credentials

- **Email:** `evaluator@innovationkit.local`
- **Password:** `Eval2025!`

## Architecture

### Files Structure

```
├── lib/
│   ├── auth.ts              # Better Auth configuration
│   ├── auth-client.ts       # React auth client
│   └── prisma.ts            # Prisma client singleton
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeding script
├── app/
│   ├── api/auth/[...all]/   # Next.js API route handlers
│   └── login/               # Login page
└── proxy.ts                 # Next.js 16 route protection
```

### Database Schema

```prisma
model user {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      session[]
  accounts      account[]
}

model session {
  id        String    @id @default(cuid())
  token     String?   @unique
  expiresAt DateTime
  userId    String
  user      user      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model account {
  id          String   @id @default(cuid())
  accountId   String
  providerId  String
  password    String?
  userId      String
  user        user     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([providerId, accountId])
}
```

## Usage

### Protecting Routes

Routes are automatically protected by `proxy.ts`. To add public routes:

```typescript
// proxy.ts
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|$).*)",
  ],
}
```

Add public routes to the matcher exclusion pattern.

### Getting Session on Server Components

```typescript
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/login")
  }

  return <div>Welcome {session.user.name}</div>
}
```

### Getting Session on Client Components

```typescript
import { authClient } from "@/lib/auth-client"

export function ClientComponent() {
  const { data: session } = authClient.useSession()

  if (!session) {
    return <div>Please log in</div>
  }

  return <div>Welcome {session.user.name}</div>
}
```

### Sign In / Sign Out

```typescript
import { authClient } from "@/lib/auth-client"

// Sign In
await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
})

// Sign Out
await authClient.signOut()
```

## Deployment

### Vercel / Production

1. **Generate secure secrets:**
   ```bash
   # Generate Better Auth secret
   openssl rand -base64 32
   ```

2. **Set environment variables:**
   ```env
   # Database (use PostgreSQL for production)
   DATABASE_URL="postgresql://user:password@host:5432/database"

   # Authentication
   EVALUATION_USER_EMAIL=your-evaluator@example.com
   EVALUATION_USER_PASSWORD=your-secure-password
   BETTER_AUTH_SECRET=<generated-secret>
   BETTER_AUTH_URL=https://your-domain.com
   ```

3. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed evaluation user:**
   ```bash
   npx tsx prisma/seed.ts
   ```

### Database Migration: SQLite → PostgreSQL

**Step 1:** Install PostgreSQL adapter
```bash
npm install pg @types/pg
```

**Step 2:** Update `.env`
```env
DATABASE_URL="postgresql://user:password@localhost:5432/innovationkit"
```

**Step 3:** Update `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Step 4:** Push schema and migrate
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

## Adding SSO (Future)

Better Auth makes it easy to add OAuth providers:

### Example: Google OAuth

1. **Add environment variables:**
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

2. **Update `lib/auth.ts`:**
   ```typescript
   import { betterAuth } from "better-auth"

   export const auth = betterAuth({
     // ... existing config
     socialProviders: {
       google: {
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       },
     },
   })
   ```

3. **Add sign-in with Google button:**
   ```typescript
   await authClient.signIn.social({
     provider: "google",
     callbackURL: "/dashboard"
   })
   ```

### Supported Providers

- Google
- Microsoft
- GitHub
- Discord
- And many more...

See [Better Auth Documentation](https://www.better-auth.com/docs/providers) for the full list.

## Troubleshooting

### "Invalid password hash" error

The password hash format is critical. Better Auth uses scrypt with format: `{hash}.{salt}`.

To reset the user:
```bash
# Delete all users
DATABASE_URL="file:./dev.db" npx tsx -e "
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
await prisma.account.deleteMany({})
await prisma.user.deleteMany({})
"

# Re-seed
DATABASE_URL="file:./dev.db" npx tsx prisma/seed.ts
```

### Session not persisting

Check that:
1. Cookies are enabled in your browser
2. `BETTER_AUTH_URL` matches your current URL
3. The database is accessible

### Proxy/route protection not working

For Next.js 16+, the file must be named `proxy.ts` (not `middleware.ts`).

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as a template
2. **Use strong passwords** - Minimum 12 characters, mixed case, numbers, symbols
3. **Enable HTTPS** - Required for secure cookies in production
4. **Rotate secrets** - Change `BETTER_AUTH_SECRET` periodically
5. **Use PostgreSQL in production** - SQLite is for development only
6. **Enable email verification** - For production, set `requireEmailVerification: true`

## Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js 16 Documentation](https://nextjs.org/blog/next-16)

## Support

For issues or questions:
1. Check the [Better Auth Discord](https://discord.gg/better-auth)
2. Review [GitHub Issues](https://github.com/better-auth/better-auth/issues)
3. Consult the [documentation](https://www.better-auth.com/docs)
