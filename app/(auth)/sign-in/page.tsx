import type { Metadata } from "next";

import { socialProvidersEnabled } from "@/lib/auth-providers";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Вход — AI Sub Sell",
  description: "Войдите в свой аккаунт, чтобы продолжить",
};

export default function SignInPage() {
  return <SignInForm socialProviders={socialProvidersEnabled} />;
}
