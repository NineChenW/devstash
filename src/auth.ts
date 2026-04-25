import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { isEmailVerificationEnabled } from "@/lib/features"
import {
  buildRateLimitKey,
  checkRateLimit,
  getRequestIp,
  minutesUntil,
} from "@/lib/rate-limit"
import authConfig from "./auth.config"

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EmailNotVerified"
}

class RateLimitedError extends CredentialsSignin {
  code = "RateLimited"
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    ...authConfig.providers.filter((p) => {
      const id = typeof p === "function" ? undefined : (p as { id?: string }).id
      return id !== "credentials"
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = typeof credentials?.email === "string" ? credentials.email : null
        const password = typeof credentials?.password === "string" ? credentials.password : null
        if (!email || !password) return null

        const normalizedEmail = email.trim().toLowerCase()
        const rl = await checkRateLimit(
          "login",
          buildRateLimitKey(getRequestIp(request), normalizedEmail),
        )
        if (!rl.success) {
          const mins = minutesUntil(rl.reset)
          const err = new RateLimitedError()
          err.message = `Too many sign-in attempts. Try again in ${mins} ${mins === 1 ? "minute" : "minutes"}.`
          throw err
        }

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
        if (!user?.password) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        if (isEmailVerificationEnabled() && !user.emailVerified) {
          throw new EmailNotVerifiedError()
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
})
