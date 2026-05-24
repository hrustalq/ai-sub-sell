import { Button, Hr, Text } from "@react-email/components";

import { BaseEmail, emailStyles } from "./_base";

interface MagicLinkEmailProps {
  signInUrl: string;
}

export function MagicLinkEmail({ signInUrl }: MagicLinkEmailProps) {
  return (
    <BaseEmail preview="Вход в AI Sub Sell по ссылке">
      <Text style={emailStyles.paragraph}>Здравствуйте!</Text>
      <Text style={emailStyles.paragraph}>
        Вы запросили вход без пароля. Нажмите кнопку ниже — откроется ваш аккаунт и
        заказы, оформленные на этот email.
      </Text>

      <Button href={signInUrl} style={emailStyles.button}>
        Войти в аккаунт
      </Button>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.paragraph}>
        Ссылка действительна <strong>15 минут</strong>. Если вы не запрашивали вход,
        проигнорируйте это письмо.
      </Text>
    </BaseEmail>
  );
}

export default MagicLinkEmail;
