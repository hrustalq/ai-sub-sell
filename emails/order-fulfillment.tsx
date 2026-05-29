import { Button, Hr, Text } from "react-email";

import { themeColors } from "@/lib/theme-colors";
import { BaseEmail, emailStyles } from "./_base";

interface OrderFulfillmentEmailProps {
  planName: string;
  orderNumber: string;
  productContent: string;
  orderUrl: string;
  telegramBotLabel: string;
  telegramBotUrl: string | null;
}

export function OrderFulfillmentEmail({
  planName,
  orderNumber,
  productContent,
  orderUrl,
  telegramBotLabel,
  telegramBotUrl,
}: OrderFulfillmentEmailProps) {
  return (
    <BaseEmail preview={`Доступ готов: ${planName}`}>
      <Text style={emailStyles.paragraph}>
        Данные доступа по заказу <strong>{planName}</strong> (№ {orderNumber}) готовы.
      </Text>

      <Text
        style={{
          ...emailStyles.paragraph,
          padding: "12px 16px",
          backgroundColor: themeColors.muted,
          borderRadius: "6px",
          fontFamily: "monospace",
          fontSize: "14px",
          whiteSpace: "pre-wrap",
        }}
      >
        {productContent}
      </Text>

      <Button href={orderUrl} style={emailStyles.button}>
        Открыть заказ на сайте
      </Button>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.paragraph}>
        Вопросы по заказу — в {telegramBotLabel}: отправьте номер <strong>{orderNumber}</strong>{" "}
        или нажмите кнопку (откроется чат заказа). На сайте переписка недоступна.
      </Text>

      {telegramBotUrl ? (
        <Button href={telegramBotUrl} style={emailStyles.button}>
          Открыть чат в {telegramBotLabel}
        </Button>
      ) : null}
    </BaseEmail>
  );
}

export default OrderFulfillmentEmail;
