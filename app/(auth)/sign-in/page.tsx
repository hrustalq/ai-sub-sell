import type { Metadata } from "next";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Вход — AI Sub Sell",
  description: "Войдите в свой аккаунт, чтобы продолжить",
};

export default function SignInPage() {
  return <SignInForm />;
}
