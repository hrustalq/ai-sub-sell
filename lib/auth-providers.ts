export const socialProvidersEnabled = {
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
} as const;

export type SocialProvider = keyof typeof socialProvidersEnabled;
