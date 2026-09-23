interface Env {
  SUBSCRIBERS: KVNamespace;
}

interface SubscriberRecord {
  email: string;
  locale: 'es' | 'en';
  subscribedAt: string;
  unsubscribeToken: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlPage(locale: 'es' | 'en', title: string, body: string, status: number) {
  const html = `
  <!DOCTYPE html>
  <html lang="${locale}">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0b1220;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#e2e8f0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;">
        <tr>
          <td align="center" style="padding:48px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#101d31;border-radius:20px;overflow:hidden;border:1px solid rgba(148,163,184,0.25);">
              <tr>
                <td style="background:linear-gradient(135deg,#38bdf8,#c084fc);padding:24px 28px;">
                  <p style="margin:0;color:#07111d;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">HOLANDA</p>
                  <h1 style="margin:6px 0 0;color:#07111d;font-size:20px;">${escapeHtml(title)}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0;font-size:15px;line-height:1.6;">${body}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function unsubscribeRecord(env: Env, email: string, token: string): Promise<'invalid' | 'not-found' | 'ok'> {
  if (!email || !token) {
    return 'invalid';
  }

  const key = `subscriber:${email}`;
  const raw = await env.SUBSCRIBERS.get(key);
  if (!raw) {
    return 'not-found';
  }

  let record: SubscriberRecord;
  try {
    record = JSON.parse(raw) as SubscriberRecord;
  } catch {
    return 'invalid';
  }

  if (record.unsubscribeToken !== token) {
    return 'invalid';
  }

  await env.SUBSCRIBERS.delete(key);
  return 'ok';
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
  const token = url.searchParams.get('token') ?? '';

  if (!env.SUBSCRIBERS || !email || !token) {
    return htmlPage('es', 'Enlace no válido', 'Este enlace de baja no es válido.', 400);
  }

  const key = `subscriber:${email}`;
  const raw = await env.SUBSCRIBERS.get(key);

  if (!raw) {
    return htmlPage(
      'es',
      'Ya estabas dado de baja',
      'Este correo ya no está suscrito a las novedades de HOLANDA.',
      200,
    );
  }

  let record: SubscriberRecord;
  try {
    record = JSON.parse(raw) as SubscriberRecord;
  } catch {
    return htmlPage('es', 'Enlace no válido', 'Este enlace de baja no es válido.', 400);
  }

  if (record.unsubscribeToken !== token) {
    return htmlPage('es', 'Enlace no válido', 'Este enlace de baja no es válido.', 403);
  }

  await env.SUBSCRIBERS.delete(key);

  const locale = record.locale === 'en' ? 'en' : 'es';
  const title = locale === 'es' ? 'Baja confirmada' : 'Unsubscribed';
  const body =
    locale === 'es'
      ? 'Te has dado de baja correctamente. Ya no recibirás avisos de novedades de HOLANDA.'
      : "You've been unsubscribed successfully. You will no longer receive HOLANDA update emails.";

  return htmlPage(locale, title, body, 200);
};

// Handles Gmail/Outlook's "one-click unsubscribe" (RFC 8058): mail clients POST here
// directly (with no page shown to the user) when List-Unsubscribe-Post is present.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
  const token = url.searchParams.get('token') ?? '';

  if (!env.SUBSCRIBERS) {
    return new Response(null, { status: 500 });
  }

  const result = await unsubscribeRecord(env, email, token);
  if (result === 'invalid') {
    return new Response(null, { status: 403 });
  }

  return new Response(null, { status: 200 });
};
