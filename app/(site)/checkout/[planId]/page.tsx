import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPlan, getPlans } from "@/lib/plans";
import { CheckoutExperience } from "./checkout-experience";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ planId: string }>;
}): Promise<Metadata> {
  const { planId } = await params;
  const plan = await getPlan(planId);
  if (!plan) {
    return { title: "Оформление заказа" };
  }
  return { title: `Оформление — ${plan.name}` };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const [plan, catalogPlans] = await Promise.all([getPlan(planId), getPlans()]);
  if (!plan) notFound();

  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <CheckoutExperience
      initialPlan={plan}
      catalogPlans={catalogPlans}
      userEmail={session?.user?.email}
      isLoggedIn={Boolean(session?.user)}
    />
  );
}
