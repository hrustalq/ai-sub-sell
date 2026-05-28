import { Hr, Text } from "react-email";

import { BaseEmail, emailStyles } from "./_base";

interface PaymentReceiptEmailProps {
  planName: string;
  amountFormatted: string;
  orderId: string;
  paidAt: string;
}

export function PaymentReceiptEmail({
  planName,
  amountFormatted,
  orderId,
  paidAt,
}: PaymentReceiptEmailProps) {
  return (
    <BaseEmail preview={`Квитанция об оплате: ${planName}`}>
      <Text style={emailStyles.paragraph}>
        <strong>Квитанция об оплате</strong>
      </Text>
      <Text style={emailStyles.paragraph}>
        Тариф: <strong>{planName}</strong>
        <br />
        Сумма: <strong>{amountFormatted}</strong>
        <br />
        Заказ: <strong>{orderId}</strong>
        <br />
        Дата: <strong>{paidAt}</strong>
      </Text>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.footer}>
        Это подтверждение оплаты. Подробности заказа и чат с поддержкой — в отдельном
        письме со ссылкой на заказ.
      </Text>
    </BaseEmail>
  );
}

export default PaymentReceiptEmail;
