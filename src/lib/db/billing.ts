import { prisma } from "@/lib/prisma"

export interface BillingUser {
  id: string
  email: string | null
  name: string | null
  isPro: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

export async function getBillingUser(userId: string): Promise<BillingUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  })
  return user
}

export async function setStripeCustomerId(
  userId: string,
  customerId: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customerId },
  })
}

export async function applySubscriptionState(args: {
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  isPro: boolean
}): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId: args.stripeCustomerId },
    data: {
      stripeSubscriptionId: args.stripeSubscriptionId,
      isPro: args.isPro,
    },
  })
}
