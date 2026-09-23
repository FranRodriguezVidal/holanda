export interface SendEmailAttachment {
  filename: string;
  content: string; // base64-encoded
  type?: string;
}

export interface SendEmailOptions {
  apiKey: string;
  from: { email: string; name?: string };
  to: string[];
  subject: string;
  html: string;
  text: string;
  attachments?: SendEmailAttachment[];
}

/**
 * Sends an email via the SendGrid v3 API.
 * Returns null on success, or an error message string on failure.
 */
export async function sendEmail(options: SendEmailOptions): Promise<string | null> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: options.to.map((email) => ({ email })) }],
      from: options.from,
      subject: options.subject,
      content: [
        { type: 'text/plain', value: options.text },
        { type: 'text/html', value: options.html },
      ],
      attachments: options.attachments?.length
        ? options.attachments.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
            type: attachment.type,
            disposition: 'attachment',
          }))
        : undefined,
    }),
  });

  if (response.ok) {
    return null;
  }

  const errorBody = await response.text().catch(() => '');
  return errorBody || `SendGrid request failed with status ${response.status}`;
}
