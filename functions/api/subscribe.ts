import { sendEmail } from '../_lib/email';

interface Env {
  SUBSCRIBERS: KVNamespace;
  SENDGRID_API_KEY: string;
}

interface SubscriberRecord {
  email: string;
  locale: 'es' | 'en';
  subscribedAt: string;
  unsubscribeToken: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const SUBSCRIBE_EMAIL_FROM_ADDRESS = 'codefrv@gmail.com';
const SUBSCRIBE_EMAIL_FROM_NAME = 'HOLANDA';

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseEmail(body: unknown) {
  if (typeof body !== 'object' || body === null || !('email' in body)) {
    return '';
  }
  return String((body as Record<string, unknown>).email ?? '').trim().toLowerCase();
}

function parseLocale(body: unknown): 'es' | 'en' {
  if (typeof body === 'object' && body !== null && 'locale' in body) {
    return String((body as Record<string, unknown>).locale ?? 'es') === 'en' ? 'en' : 'es';
  }
  return 'es';
}

function buildWelcomeEmail(locale: 'es' | 'en', unsubscribeUrl: string) {
  const isEs = locale === 'es';
  const title = isEs ? '¡Bienvenido a HOLANDA!' : 'Welcome to HOLANDA!';
  const intro = isEs
    ? 'Te avisaremos por aquí cuando saquemos nuevas actualizaciones, funciones o novedades del juego.'
    : "We'll email you here whenever we ship new updates, features or news about the game.";
  const unsubscribeLabel = isEs ? 'Darse de baja' : 'Unsubscribe';
  const unsubscribeHint = isEs
    ? 'Si no quieres seguir recibiendo estos avisos, puedes darte de baja en cualquier momento.'
    : 'If you no longer want to receive these emails, you can unsubscribe at any time.';
  const footer = isEs
    ? 'Recibiste este correo porque te suscribiste a las novedades de HOLANDA.'
    : 'You received this email because you subscribed to HOLANDA updates.';

  const html = `
  <!DOCTYPE html>
  <html lang="${locale}">
    <body style="margin:0;padding:0;background-color:#0b1220;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1220;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#101d31;border-radius:20px;overflow:hidden;border:1px solid rgba(148,163,184,0.25);">
              <tr>
                <td style="background:linear-gradient(135deg,#38bdf8,#c084fc);padding:24px 28px;">
                  <p style="margin:0;color:#07111d;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">HOLANDA</p>
                  <h1 style="margin:6px 0 0;color:#07111d;font-size:22px;">${escapeHtml(title)}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 20px;color:#e2e8f0;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(148,163,184,0.2);padding-top:16px;margin-top:8px;">
                    <tr>
                      <td style="color:#94a3b8;font-size:12px;line-height:1.6;">
                        ${escapeHtml(unsubscribeHint)}<br />
                        <a href="${unsubscribeUrl}" style="color:#38bdf8;text-decoration:none;font-weight:700;">${escapeHtml(unsubscribeLabel)}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 28px;background-color:#0b1524;">
                  <p style="margin:0;color:#475569;font-size:11px;text-align:center;">${escapeHtml(footer)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  const text = `${title}\n\n${intro}\n\n${unsubscribeLabel}: ${unsubscribeUrl}\n\n${footer}`;

  return { html, text, subject: title };
}

async function sendWelcomeEmail(env: Env, record: SubscriberRecord, origin: string) {
  if (!env.SENDGRID_API_KEY) {
    return 'Email service is not configured.';
  }

  const unsubscribeUrl = `${origin}/api/unsubscribe?email=${encodeURIComponent(record.email)}&token=${encodeURIComponent(record.unsubscribeToken)}`;
  const { html, text, subject } = buildWelcomeEmail(record.locale, unsubscribeUrl);

  return sendEmail({
    apiKey: env.SENDGRID_API_KEY,
    from: { email: SUBSCRIBE_EMAIL_FROM_ADDRESS, name: SUBSCRIBE_EMAIL_FROM_NAME },
    to: [record.email],
    subject,
    html,
    text,
    headers: {
      // Lets Gmail/Outlook show a native "Unsubscribe" action and treat this as a
      // trusted mailing-list message instead of flagging it as suspicious/spam.
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.SUBSCRIBERS) {
    return jsonResponse({ error: 'Subscription service is not configured.' }, 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  const email = parseEmail(body);
  const locale = parseLocale(body);

  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    return jsonResponse({ error: 'Please provide a valid email address.' }, 400);
  }

  const key = `subscriber:${email}`;
  const existing = await env.SUBSCRIBERS.get(key);
  if (existing) {
    return jsonResponse({ ok: true, alreadySubscribed: true }, 200);
  }

  const record: SubscriberRecord = {
    email,
    locale,
    subscribedAt: new Date().toISOString(),
    unsubscribeToken: crypto.randomUUID(),
  };

  await env.SUBSCRIBERS.put(key, JSON.stringify(record));

  const origin = new URL(request.url).origin;
  const welcomeEmailError = await sendWelcomeEmail(env, record, origin);
  if (welcomeEmailError) {
    console.error('Failed to send welcome email:', welcomeEmailError);
  }

  return jsonResponse({ ok: true, alreadySubscribed: false, welcomeEmailSent: !welcomeEmailError }, 200);
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.SUBSCRIBERS) {
    return jsonResponse({ error: 'Subscription service is not configured.' }, 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  const email = parseEmail(body);
  if (!email || !EMAIL_REGEX.test(email)) {
    return jsonResponse({ error: 'Please provide a valid email address.' }, 400);
  }

  const key = `subscriber:${email}`;
  const existing = await env.SUBSCRIBERS.get(key);
  if (!existing) {
    return jsonResponse({ ok: true, wasSubscribed: false }, 200);
  }

  await env.SUBSCRIBERS.delete(key);
  return jsonResponse({ ok: true, wasSubscribed: true }, 200);
};
