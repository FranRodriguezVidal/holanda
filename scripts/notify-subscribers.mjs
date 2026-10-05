// Usage: node scripts/notify-subscribers.mjs [--dry-run]
// Reads subscribers from the production KV namespace and sends the update email via SendGrid.
// SENDGRID_API_KEY is read from .dev.vars (git-ignored) or the environment.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const ORIGIN = 'https://holanda.pages.dev';
const NAMESPACE_ID = '4fd704204f5e4a2cb047bba7683d9bb5';
const FROM = { email: 'codefrv@gmail.com', name: 'HOLANDA' };
const dryRun = process.argv.includes('--dry-run');

let apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey && existsSync('.dev.vars')) {
  const line = readFileSync('.dev.vars', 'utf8').split(/\r?\n/).find((l) => l.startsWith('SENDGRID_API_KEY='));
  apiKey = line?.slice('SENDGRID_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
}
if (!apiKey && !dryRun) {
  console.error('Missing SENDGRID_API_KEY');
  process.exit(1);
}

const wrangler = (args) =>
  execFileSync('npx', ['wrangler', 'kv', 'key', ...args, '--namespace-id', NAMESPACE_ID, '--remote'], {
    encoding: 'utf8',
    shell: true,
    maxBuffer: 64 * 1024 * 1024,
  });

const keys = JSON.parse(wrangler(['list', '--prefix', 'subscriber:'])).map((k) => k.name);
console.log(`Subscribers found: ${keys.length}`);

const escapeHtml = (v) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const content = {
  es: {
    subject: 'Novedades en HOLANDA: cartas clásicas, dificultad renovada y más',
    title: '¡Nuevas actualizaciones en HOLANDA!',
    items: [
      'Arte clásico de cartas, incluido el dorso, y animación de inicio con toda la baraja.',
      'Dificultad renovada: más castigos, menos miradas, menos Jokers y bots con memoria justa.',
      'Animaciones fluidas al robar, intercambiar, descartar y castigar; arreglado el bloqueo de la J.',
      'Nueva guía ilustrada de Cómo jugar con cada carta, su poder y sus puntos.',
      'Control de volumen para la música de fondo (la pista llegará pronto).',
      'Reportes y correos de novedades más fiables.',
    ],
    cta: 'Jugar ahora',
    unsub: 'Darse de baja',
    hint: 'Si no quieres recibir más avisos, puedes darte de baja en cualquier momento.',
  },
  en: {
    subject: 'New in HOLANDA: classic cards, revamped difficulty and more',
    title: 'New updates in HOLANDA!',
    items: [
      'Classic card artwork, including the card back, and a home animation with the whole deck.',
      'Revamped difficulty: more punishments, fewer peeks, fewer Jokers and bots with fair memory.',
      'Smooth animations for drawing, swapping, discarding and punishing; Jack freeze fixed.',
      'New illustrated How to play guide with every card, its power and its points.',
      'Volume control for background music (the track is coming soon).',
      'More reliable reports and update emails.',
    ],
    cta: 'Play now',
    unsub: 'Unsubscribe',
    hint: 'If you no longer want these emails, you can unsubscribe at any time.',
  },
};

function build(locale, unsubscribeUrl) {
  const t = content[locale] ?? content.es;
  const list = t.items.map((i) => `<li style="margin:0 0 8px;">${escapeHtml(i)}</li>`).join('');
  const html = `<!DOCTYPE html><html lang="${locale}"><body style="margin:0;padding:24px 12px;background:#0b1220;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#101d31;border-radius:20px;overflow:hidden;border:1px solid rgba(148,163,184,0.25);">
<tr><td style="background:linear-gradient(135deg,#38bdf8,#c084fc);padding:24px 28px;"><p style="margin:0;color:#07111d;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">HOLANDA</p><h1 style="margin:6px 0 0;color:#07111d;font-size:22px;">${escapeHtml(t.title)}</h1></td></tr>
<tr><td style="padding:28px;color:#e2e8f0;font-size:15px;line-height:1.6;"><ul style="margin:0 0 24px;padding-left:20px;">${list}</ul>
<a href="${ORIGIN}" style="display:inline-block;background:#38bdf8;color:#07111d;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:999px;">${escapeHtml(t.cta)}</a>
<p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">${escapeHtml(t.hint)}<br /><a href="${unsubscribeUrl}" style="color:#38bdf8;font-weight:700;">${escapeHtml(t.unsub)}</a></p></td></tr>
</table></td></tr></table></body></html>`;
  const text = `${t.title}\n\n${t.items.map((i) => `- ${i}`).join('\n')}\n\n${t.cta}: ${ORIGIN}\n\n${t.unsub}: ${unsubscribeUrl}`;
  return { subject: t.subject, html, text };
}

let sent = 0;
let failed = 0;
for (const key of keys) {
  const record = JSON.parse(wrangler(['get', `"${key}"`, '--text']));
  const unsubscribeUrl = `${ORIGIN}/api/unsubscribe?email=${encodeURIComponent(record.email)}&token=${encodeURIComponent(record.unsubscribeToken)}`;
  const { subject, html, text } = build(record.locale, unsubscribeUrl);
  if (dryRun) {
    console.log(`[dry-run] would send to ${record.email} (${record.locale})`);
    continue;
  }
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: record.email }] }],
      from: FROM,
      subject,
      headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });
  if (res.ok) {
    sent += 1;
    console.log(`sent -> ${record.email}`);
  } else {
    failed += 1;
    console.error(`FAILED -> ${record.email}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
}
console.log(`Done. sent=${sent} failed=${failed}`);
