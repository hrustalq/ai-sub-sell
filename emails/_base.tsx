import React, { type ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

import { SITE_NAME } from "@/lib/brand";
import { themeColors } from "@/lib/theme-colors";

export const emailStyles = {
  main: {
    backgroundColor: themeColors.muted,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  },
  container: {
    margin: "0 auto",
    padding: "20px 0 48px",
    maxWidth: "560px",
  },
  box: {
    padding: "24px",
    backgroundColor: themeColors.card,
    borderRadius: "8px",
    border: `1px solid ${themeColors.border}`,
  },
  hr: {
    borderColor: themeColors.border,
    margin: "24px 0",
  },
  paragraph: {
    margin: "0 0 16px",
    fontSize: "15px",
    lineHeight: "24px",
    color: themeColors.foreground,
  },
  footer: {
    fontSize: "12px",
    lineHeight: "18px",
    color: themeColors.mutedForeground,
    margin: "0",
  },
  button: {
    backgroundColor: themeColors.primary,
    borderRadius: "6px",
    color: themeColors.primaryForeground,
    fontSize: "15px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 24px",
  },
};

interface BaseEmailProps {
  preview: string;
  children: ReactNode;
}

export function BaseEmail({ preview, children }: BaseEmailProps) {
  return (
    <Html lang="ru">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Section style={{ padding: "0 0 16px" }}>
            <Text
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: themeColors.primary,
                margin: 0,
              }}
            >
              {SITE_NAME}
            </Text>
          </Section>

          <Section style={emailStyles.box}>{children}</Section>

          <Section style={{ padding: "16px 0 0" }}>
            <Text style={emailStyles.footer}>
              Это письмо было отправлено автоматически. Пожалуйста, не
              отвечайте на него.
            </Text>
            <Text style={{ ...emailStyles.footer, margin: "4px 0 0" }}>
              © {new Date().getFullYear()} {SITE_NAME}. Все права защищены.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
