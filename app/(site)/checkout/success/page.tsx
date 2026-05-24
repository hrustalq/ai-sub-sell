import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Оплата",
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; token?: string }>;
}) {
  const { orderId, token } = await searchParams;

  if (orderId && token) {
    redirect(`/orders/${orderId}?token=${encodeURIComponent(token)}`);
  }

  if (orderId) {
    redirect(`/orders/${orderId}`);
  }

  redirect("/");
}
