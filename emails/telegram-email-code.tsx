import React from "react";
import { Hr, Text } from "react-email";

import { SITE_NAME } from "@/lib/brand";
import { BaseEmail, emailStyles } from "./_base";

interface TelegramEmailCodeEmailProps {
  code: string;
  expiresMinutes: number;
}

export function TelegramEmailCodeEmail({
  code,
  expiresMinutes,
}: TelegramEmailCodeEmailProps) {
  return (
    <BaseEmail preview={`Код подтверждения: ${code}`}>
      <Text style={emailStyles.paragraph}>Здравствуйте!</Text>
      <Text style={emailStyles.paragraph}>
        Вы привязываете этот email к Telegram-боту {SITE_NAME}. Введите код
        ниже в боте:
      </Text>

      <Text
        style={{
          ...emailStyles.paragraph,
          fontSize: "28px",
          fontWeight: "700",
          letterSpacing: "6px",
          textAlign: "center" as const,
          margin: "24px 0",
        }}
      >
        {code}
      </Text>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.paragraph}>
        Код действителен <strong>{expiresMinutes} минут</strong>. Если вы не
        запрашивали привязку, проигнорируйте это письмо.
      </Text>
    </BaseEmail>
  );
}

export default TelegramEmailCodeEmail;
