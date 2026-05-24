import type { Metadata } from "next";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Сброс пароля",
  description: "Установите новый пароль для вашего аккаунта",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
