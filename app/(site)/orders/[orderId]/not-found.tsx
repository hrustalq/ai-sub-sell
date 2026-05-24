import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Заказ недоступен</h1>
      <p className="text-sm text-muted-foreground">
        Проверьте ссылку из письма или после оплаты. Без секретного ключа открыть заказ нельзя.
      </p>
      <Button asChild>
        <Link href="/">На главную</Link>
      </Button>
    </main>
  );
}
