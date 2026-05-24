import Link from "next/link";
import { CheckCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <main className="min-h-screen bg-muted flex items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md flex flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-primary/10 p-5">
          <CheckCircleIcon className="size-12 text-primary" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">Оплата прошла успешно!</h1>
          <p className="text-muted-foreground">
            Ваш заказ принят. Инструкции по настройке доступа придут на email
            после подтверждения платежа.
          </p>
          {orderId && (
            <p className="mt-1 text-xs text-muted-foreground">Номер заказа: {orderId}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/">На главную</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a
              href="https://www.kdocs.cn/l/csBw2oPEKKGI"
              target="_blank"
              rel="noopener noreferrer"
            >
              Инструкция по настройке
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
