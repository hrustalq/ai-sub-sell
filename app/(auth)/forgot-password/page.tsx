import type { Metadata } from "next";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  description: "Введите email для получения ссылки на сброс пароля",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
