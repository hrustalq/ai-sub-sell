"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, Eye, EyeOff, ShieldAlert } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <Card>
        <CardHeader className="items-center text-center pb-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
            <ShieldAlert className="size-6 text-destructive" />
          </div>
          <CardTitle className="text-h3 font-semibold">Недействительная ссылка</CardTitle>
          <CardDescription>
            Ссылка для сброса пароля недействительна или устарела.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center border-t pt-6">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Запросить новую ссылку
          </Link>
        </CardFooter>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });

    setLoading(false);

    if (error) {
      if (error.code === "INVALID_TOKEN" || error.status === 400) {
        setError("Ссылка недействительна или истекла. Запросите новую.");
      } else {
        setError(error.message ?? "Произошла ошибка. Попробуйте ещё раз.");
      }
    } else {
      router.push("/sign-in?reset=success");
    }
  }

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-h2 font-semibold">
          Новый пароль
        </CardTitle>
        <CardDescription>
          Введите новый пароль для вашего аккаунта
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">Новый пароль</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={loading}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Скрыть пароль" : "Показать пароль"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            {error && (
              <FieldError>
                {error}{" "}
                {error.includes("Запросите новую") && (
                  <Link
                    href="/forgot-password"
                    className="underline underline-offset-4"
                  >
                    Восстановить пароль
                  </Link>
                )}
              </FieldError>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading && <Spinner className="mr-1" />}
              {loading ? "Сохранение..." : "Сохранить пароль"}
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
  );
}

export function ResetPasswordForm() {
  return (
    <div className="w-full max-w-md">
      <Suspense
        fallback={
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Spinner className="size-6" />
            </CardContent>
          </Card>
        }
      >
        <ResetPasswordFormInner />
      </Suspense>
    </div>
  );
}
