import { Button, Hr, Text } from "react-email";

import { themeColors } from "@/lib/theme-colors";
import { BaseEmail, emailStyles } from "./_base";

interface OrderPaidEmailProps {
  planName: string;
  amountFormatted: string;
  orderNumber: string;
  orderUrl: string;
  telegramBotUrl: string | null;
  signInUrl: string;
}

export function OrderPaidEmail({
  planName,
  amountFormatted,
  orderNumber,
  orderUrl,
  telegramBotUrl,
  signInUrl,
}: OrderPaidEmailProps) {
  return (
    <BaseEmail preview={`Оплата получена: ${planName}`}>
      <Text style={emailStyles.paragraph}>
        Спасибо за покупку <strong>{planName}</strong>!
      </Text>
      <Text style={emailStyles.paragraph}>
        Мы получили оплату <strong>{amountFormatted}</strong>. Номер заказа:{" "}
        <strong>{orderNumber}</strong>.
      </Text>
      <Text style={emailStyles.paragraph}>
        Данные доступа появятся на странице заказа и придут на email после выдачи.
        Вопросы по заказу — в Telegram-боте: отправьте номер <strong>{orderNumber}</strong>{" "}
        или нажмите кнопку ниже.
      </Text>

      {telegramBotUrl ? (
        <Button href={telegramBotUrl} style={emailStyles.button}>
          Открыть чат в Telegram
        </Button>
      ) : null}

      <Button href={orderUrl} style={emailStyles.button}>
        Открыть заказ на сайте
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
