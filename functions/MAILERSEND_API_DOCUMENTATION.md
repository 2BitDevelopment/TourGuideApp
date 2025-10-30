# MailerSend API Integration Documentation

## Overview

This document provides comprehensive documentation for the MailerSend email service integration used in the TourGuideApp Firebase Functions. MailerSend is a third-party transactional email service that handles sending automated analytics reports.

## Service Information

- **Service Name**: MailerSend
- **Purpose**: Transactional email delivery for analytics reports
- **Integration Method**: SMTP via Nodemailer
- **Documentation**: https://www.mailersend.com/help/

## Configuration

### Environment Variables

The following environment variables must be configured in Firebase Functions:

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_SERVER` | MailerSend SMTP server hostname | `smtp.mailersend.net` |
| `SMTP_PORT` | SMTP port number | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | MailerSend SMTP username | `MS_******@trial-*****.mlsender.net` |
| `SMTP_PASS` | MailerSend SMTP password/API token | Your MailerSend API token |
| `RECIPIENT_EMAIL` | Default recipient email address | `jwehart.7@gmail.com` |

### Configuration File

Location: `functions/src/config.ts`

```typescript
export const mailersendConfig: SMTPTransportOptions = {
  host: process.env.SMTP_SERVER,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};
```

## Setup Instructions

### 1. MailerSend Account Setup

1. Sign up for a MailerSend account at https://www.mailersend.com
2. Verify your domain or use the trial domain
3. Navigate to **Settings** → **API Tokens**
4. Generate a new SMTP token with appropriate permissions

### 2. Configure 

Access environment variables in code:
- `process.env.SMTP_SERVER`
- `process.env.SMTP_PORT`
- `process.env.SMTP_USER`
- `process.env.SMTP_PASS`
- `process.env.RECIPIENT_EMAIL`

## API Usage

### Email Sending Function

Location: `functions/src/index.ts`

```typescript
async function sendEmail(attachment: Buffer, subject: string)
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `attachment` | `Buffer` | PDF report content as a Buffer |
| `subject` | `string` | Email subject line |

### Attachment Format

The PDF report is attached using base64 encoding:

```typescript
attachments: [
  {
    filename: "Cathedral_Analytics_Report.pdf",  // Display name
    content: attachment.toString('base64'),      // Base64 string
    encoding: 'base64',                          // Encoding type
  },
]
```

- **API Reference**: https://developers.mailersend.com/
