import nodemailer from "nodemailer";
import { render } from "react-email";
import { SITE_NAME } from "./brand";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

const FROM = `"${process.env.SMTP_FROM_NAME ?? SITE_NAME}" <${process.env.SMTP_FROM_EMAIL}>`;

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM_EMAIL?.trim());
}

export async function sendEmail({
  to,
  subject,
  template,
}: {
  to: string;
  subject: string;
  template: React.ReactElement;
}) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured (SMTP_HOST and SMTP_FROM_EMAIL required)");
  }

  const html = await render(template);
  const text = await render(template, { plainText: true });
  await transporter.sendMail({ from: FROM, to, subject, html, text });
}
