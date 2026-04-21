import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { isEmailVerificationEnabled } from "@/lib/features"
import authConfig from "./auth.config"

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EmailNotVerified"
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
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email : null
        const password = typeof credentials?.password === "string" ? credentials.password : null
        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
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
