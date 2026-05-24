import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createElement } from "react";
import db from "./db";
import { sendEmail } from "./email";
import { MagicLinkEmail } from "../emails/magic-link";
import { ResetPasswordEmail } from "../emails/reset-password";
import { linkOrdersToUserByEmail } from "./users/placeholder";
import { socialProvidersEnabled } from "./auth-providers";

export { socialProvidersEnabled };

function getSocialProviders() {
  const providers: Record<
    string,
    { clientId: string; clientSecret: string }
  > = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  }

  return providers;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(db, {
    provider: "sqlite",
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "credential", "email-password"],
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Сброс пароля — AI Sub Sell",
        template: createElement(ResetPasswordEmail, {
          userName: user.name,
          resetUrl: url,
        }),
      });
    },
  },
  socialProviders: getSocialProviders(),
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { email: true },
          });
          if (user?.email) {
            await linkOrdersToUserByEmail(session.userId, user.email);
          }
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    magicLink({
      expiresIn: 60 * 15,
      disableSignUp: false,
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "Вход в AI Sub Sell",
          template: createElement(MagicLinkEmail, { signInUrl: url }),
        });
      },
    }),
  ],
});
