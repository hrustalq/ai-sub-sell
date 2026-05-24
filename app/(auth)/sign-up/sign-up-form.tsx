"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import type { SocialProvider } from "@/lib/auth-providers";
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

type SignUpFormProps = {
  socialProviders: Record<SocialProvider, boolean>;
};

export function SignUpForm({ socialProviders }: SignUpFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showSocialLogin = socialProviders.google || socialProviders.github;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/",
    });

    if (error) {
      setError(error.message ?? "Произошла ошибка при регистрации");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  async function handleSocial(provider: SocialProvider) {
    setSocialLoading(provider);
    setError(null);

    const { error: socialError } = await authClient.signIn.social({
      provider,
      callbackURL: "/",
      errorCallbackURL: "/sign-in?error=social",
    });

    if (socialError) {
      setError(socialError.message ?? "Не удалось войти через соцсеть");
      setSocialLoading(null);
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Создать аккаунт
          </CardTitle>
          <CardDescription>
            Зарегистрируйтесь, чтобы начать работу
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {showSocialLogin && (
            <div className="flex flex-col gap-3">
              {socialProviders.google && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleSocial("google")}
                  disabled={!!socialLoading || loading}
                >
                  {socialLoading === "google" ? <Spinner /> : <GoogleIcon />}
                  Продолжить с Google
                </Button>
              )}
              {socialProviders.github && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleSocial("github")}
                  disabled={!!socialLoading || loading}
                >
                  {socialLoading === "github" ? (
                    <Spinner />
                  ) : (
                    <GitHubIcon />
                  )}
                  Продолжить с GitHub
                </Button>
              )}
            </div>
          )}

          {showSocialLogin && (
            <div className="relative my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">или</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Имя</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван Иванов"
                  autoComplete="name"
                  required
                  disabled={loading || !!socialLoading}
                />
              </Field>

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
                <FieldLabel htmlFor="password">Пароль</FieldLabel>
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
                disabled={loading || !!socialLoading}
              >
                {loading && <Spinner className="mr-1" />}
                {loading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Нажимая кнопку, вы принимаете{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-4 hover:text-primary transition-colors"
                >
                  условия использования
                </Link>{" "}
                и{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-primary transition-colors"
                >
                  политику конфиденциальности
                </Link>
              </p>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Войти
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
