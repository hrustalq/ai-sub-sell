import type { Metadata } from "next";

import { socialProvidersEnabled } from "@/lib/auth-providers";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создайте аккаунт и начните работу",
};

export default function SignUpPage() {
  return <SignUpForm socialProviders={socialProvidersEnabled} />;
}
