import type { AdminPaymentRecord } from "@/lib/admin/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentsTable } from "@/app/admin/_components/payments-table";

type UserPaymentsSectionProps = {
  payments: AdminPaymentRecord[];
};

export function UserPaymentsSection({ payments }: UserPaymentsSectionProps) {
  return (
    <Card className="flex min-h-[360px] flex-1 flex-col gap-0 py-0">
      <CardHeader className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
        <CardTitle className="text-base">Платежи</CardTitle>
        <CardDescription>
          Заказы пользователя, включая оформленные до регистрации по тому же email.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <PaymentsTable data={payments} hideCustomer />
      </CardContent>
    </Card>
  );
}
