import type { Options as SMTPTransportOptions } from "nodemailer/lib/smtp-transport";

export const mailersendConfig: SMTPTransportOptions = {
  host: process.env.SMTP_SERVER,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};