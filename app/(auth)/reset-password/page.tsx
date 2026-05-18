import type { Metadata } from "next";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Сброс пароля — AI Sub Sell",
  description: "Установите новый пароль для вашего аккаунта",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
