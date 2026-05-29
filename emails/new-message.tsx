import { Button, Text } from "react-email";

import { themeColors } from "@/lib/theme-colors";
import { BaseEmail, emailStyles } from "./_base";

interface NewMessageEmailProps {
  planName: string;
  orderId: string;
  preview: string;
  orderUrl: string;
  recipientRole: "buyer" | "support";
}

export function NewMessageEmail({
  planName,
  orderId,
  preview,
  orderUrl,
  recipientRole,
}: NewMessageEmailProps) {
  const who =
    recipientRole === "buyer" ? "продавца" : "покупателя";

  return (
    <BaseEmail preview={`Новое сообщение по заказу ${planName}`}>
      <Text style={emailStyles.paragraph}>
        У вас новое сообщение от {who} по заказу <strong>{planName}</strong> (№{" "}
        {orderId}).
      </Text>
      <Text
        style={{
          ...emailStyles.paragraph,
          padding: "12px 16px",
          backgroundColor: themeColors.muted,
          borderRadius: "6px",
          fontStyle: "italic",
        }}
      >
        «{preview}»
      </Text>
      <Text style={emailStyles.paragraph}>
        {recipientRole === "buyer"
          ? "Сообщение оставалось непрочитанным более 10 минут — ответьте в Telegram-боте (/orders)."
          : "Сообщение оставалось непрочитанным более 10 минут — ответьте в панели поддержки."}
      </Text>

      <Button href={orderUrl} style={emailStyles.button}>
        {recipientRole === "buyer" ? "Открыть Telegram-бот" : "Ответить в поддержке"}
      </Button>
    </BaseEmail>
  );
}

export default NewMessageEmail;
