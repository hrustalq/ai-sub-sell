import { Button, Hr, Text } from "@react-email/components";

import { SITE_NAME } from "@/lib/brand";
import { BaseEmail, emailStyles } from "./_base";

interface ResetPasswordEmailProps {
  userName: string;
  resetUrl: string;
}

export function ResetPasswordEmail({
  userName,
  resetUrl,
}: ResetPasswordEmailProps) {
  return (
    <BaseEmail preview={`Сброс пароля для вашего аккаунта ${SITE_NAME}`}>
      <Text style={emailStyles.paragraph}>
        Привет, <strong>{userName}</strong>!
      </Text>
      <Text style={emailStyles.paragraph}>
        Мы получили запрос на сброс пароля для вашего аккаунта. Нажмите на
        кнопку ниже, чтобы установить новый пароль.
      </Text>

      <Button href={resetUrl} style={emailStyles.button}>
        Сбросить пароль
      </Button>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.paragraph}>
        Ссылка действительна в течение <strong>1 часа</strong>.
      </Text>
      <Text style={emailStyles.footer}>
        Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
        Ваш пароль останется прежним.
      </Text>
    </BaseEmail>
  );
}

export default ResetPasswordEmail;
