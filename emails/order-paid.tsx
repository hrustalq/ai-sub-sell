import { Button, Hr, Text } from "react-email";

import { themeColors } from "@/lib/theme-colors";
import { BaseEmail, emailStyles } from "./_base";

interface OrderPaidEmailProps {
  planName: string;
  amountFormatted: string;
  orderId: string;
  orderUrl: string;
  signInUrl: string;
}

export function OrderPaidEmail({
  planName,
  amountFormatted,
  orderId,
  orderUrl,
  signInUrl,
}: OrderPaidEmailProps) {
  return (
    <BaseEmail preview={`Оплата получена: ${planName}`}>
      <Text style={emailStyles.paragraph}>
        Спасибо за покупку <strong>{planName}</strong>!
      </Text>
      <Text style={emailStyles.paragraph}>
        Мы получили оплату <strong>{amountFormatted}</strong>. Номер заказа:{" "}
        <strong>{orderId}</strong>.
      </Text>
      <Text style={emailStyles.paragraph}>
        Данные доступа и переписка с поддержкой доступны на странице заказа. Вы также
        можете войти по email без пароля — все ваши заказы будут в личном кабинете.
      </Text>

      <Button href={orderUrl} style={emailStyles.button}>
        Открыть заказ
      </Button>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.paragraph}>
        <a
          href={signInUrl}
          style={{ color: themeColors.primary, textDecoration: "underline" }}
        >
          Войти по ссылке на email
        </a>{" "}
        (без пароля)
      </Text>
    </BaseEmail>
  );
}

export default OrderPaidEmail;
