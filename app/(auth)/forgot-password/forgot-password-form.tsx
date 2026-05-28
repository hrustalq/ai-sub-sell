"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, MailCheck } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Произошла ошибка. Попробуйте ещё раз.");
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="items-center text-center pb-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-2">
              <MailCheck className="size-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-h3 font-semibold">Проверьте почту</CardTitle>
            <CardDescription>
              Если аккаунт с адресом <strong>{email}</strong> существует, мы
              отправили ссылку для сброса пароля.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground text-center">
              Не получили письмо? Проверьте папку «Спам» или{" "}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                попробуйте снова
              </button>
              .
            </p>
          </CardContent>
          <CardFooter className="justify-center border-t pt-6">
            <Link
              href="/sign-in"
              className="flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeftIcon className="size-4" /> Вернуться к входу
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-h2 font-semibold">
            Забыли пароль?
          </CardTitle>
          <CardDescription>
            Введите email — мы пришлём ссылку для сброса пароля
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading && <Spinner className="mr-1" />}
                {loading ? "Отправка..." : "Отправить ссылку"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t pt-6">
          <Link
            href="/sign-in"
            className="flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            <ArrowLeftIcon className="size-4" /> Вернуться к входу
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
