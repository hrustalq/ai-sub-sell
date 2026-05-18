import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export const emailStyles = {
  main: {
    backgroundColor: "#f6f6f6",
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
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e4e4e4",
  },
  hr: {
    borderColor: "#e4e4e4",
    margin: "24px 0",
  },
  paragraph: {
    margin: "0 0 16px",
    fontSize: "15px",
    lineHeight: "24px",
    color: "#3c4149",
  },
  footer: {
    fontSize: "12px",
    lineHeight: "18px",
    color: "#8898aa",
    margin: "0",
  },
  button: {
    backgroundColor: "#111111",
    borderRadius: "6px",
    color: "#ffffff",
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
  children: React.ReactNode;
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
                color: "#111",
                margin: 0,
              }}
            >
              AI Sub Sell
            </Text>
          </Section>

          <Section style={emailStyles.box}>{children}</Section>

          <Section style={{ padding: "16px 0 0" }}>
            <Text style={emailStyles.footer}>
              Это письмо было отправлено автоматически. Пожалуйста, не
              отвечайте на него.
            </Text>
            <Text style={{ ...emailStyles.footer, margin: "4px 0 0" }}>
              © {new Date().getFullYear()} AI Sub Sell. Все права защищены.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
