"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { GitHubIcon, GoogleIcon } from "@/components/icons";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

function SignInFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const callbackUrl = searchParams.get("callbackUrl") ?? "/";

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: callbackUrl,
    });

    if (error) {
      setError(error.message ?? "Произошла ошибка при входе");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setError("Укажите email для входа по ссылке");
      return;
    }

    setMagicLinkLoading(true);
    setError(null);
    setMagicLinkSent(false);

    const callbackUrl = searchParams.get("callbackUrl") ?? "/user/payments";

    const { error: magicError } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: callbackUrl,
    });

    setMagicLinkLoading(false);

    if (magicError) {
      setError(magicError.message ?? "Не удалось отправить ссылку");
      return;
    }

    setMagicLinkSent(true);
  }

  async function handleSocial(provider: "google" | "github") {
    setSocialLoading(provider);
    const callbackUrl = searchParams.get("callbackUrl") ?? "/";
    await authClient.signIn.social({ provider, callbackURL: callbackUrl });
    setSocialLoading(null);
  }

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Добро пожаловать
        </CardTitle>
        <CardDescription>Войдите в свой аккаунт</CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        {resetSuccess && (
          <div className="mb-4 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
            Пароль успешно изменён. Войдите с новым паролем.
          </div>
        )}

        {magicLinkSent && (
          <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            Ссылка для входа отправлена на <strong>{email}</strong>. Проверьте почту —
            после входа откроются ваши заказы.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => handleSocial("google")}
            disabled={!!socialLoading || loading}
          >
            {socialLoading === "google" ? <Spinner /> : <GoogleIcon />}
            Продолжить с Google
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => handleSocial("github")}
            disabled={!!socialLoading || loading}
          >
            {socialLoading === "github" ? <Spinner /> : <GitHubIcon />}
            Продолжить с GitHub
          </Button>
        </div>

        <div className="relative my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">или</span>
          <div className="h-px flex-1 bg-border" />
        </div>

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
                disabled={loading || !!socialLoading}
              />
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Пароль</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  Забыли пароль?
                </Link>
              </div>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading || !!socialLoading}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
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

            {error && <FieldError>{error}</FieldError>}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !!socialLoading || magicLinkLoading}
            >
              {loading && <Spinner className="mr-1" />}
              {loading ? "Вход..." : "Войти"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading || !!socialLoading || magicLinkLoading || !email.trim()}
              onClick={handleMagicLink}
            >
              {magicLinkLoading && <Spinner className="mr-1" />}
              {magicLinkLoading ? "Отправка..." : "Войти по ссылке на email"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Зарегистрироваться
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export function SignInForm() {
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
        <SignInFormInner />
      </Suspense>
    </div>
  );
}
