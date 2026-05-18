import type { Metadata } from "next";

import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Регистрация — AI Sub Sell",
  description: "Создайте аккаунт и начните работу",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
