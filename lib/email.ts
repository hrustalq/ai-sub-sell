import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { SITE_NAME } from "./brand";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"${process.env.SMTP_FROM_NAME ?? SITE_NAME}" <${process.env.SMTP_FROM_EMAIL}>`;

export async function sendEmail({
  to,
  subject,
  template,
}: {
  to: string;
  subject: string;
  template: React.ReactElement;
}) {
  const html = await render(template);
  const text = await render(template, { plainText: true });
  await transporter.sendMail({ from: FROM, to, subject, html, text });
}
