import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { YandexMetrika } from "@/components/analytics/yandex-metrika";
import { ThemeProvider } from "@/components/theme-provider";
import { createRootMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata = createRootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={cn(
        "h-dvh overflow-hidden",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="flex h-dvh flex-col overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </TooltipProvider>
        </ThemeProvider>
        <YandexMetrika />
      </body>
    </html>
  );
}
