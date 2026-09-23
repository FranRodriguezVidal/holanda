import { sendEmail } from '../_lib/email';

interface Env {
  SENDGRID_API_KEY: string;
}

const REPORT_EMAIL_TO = 'codefrv@gmail.com';
const REPORT_EMAIL_FROM_ADDRESS = 'codefrv@gmail.com';
const REPORT_EMAIL_FROM_NAME = 'HOLANDA Reports';
const MAX_ATTACHMENT_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 4000;

const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
]);

const BLOCKED_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.html',
  '.htm',
  '.css',
  '.svg',
  '.php',
  '.py',
  '.sh',
  '.bat',
  '.cmd',
  '.ps1',
  '.exe',
  '.msi',
  '.dll',
  '.apk',
  '.jar',
  '.scr',
]);

const BLOCKED_TEXT_PATTERNS = [
  /<script\b/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /new\s+XMLHttpRequest/i,
  /onerror\s*=/i,
  /\b(?:curl|wget)\s+-/i,
];

const CATEGORY_LABELS: Record<string, string> = {
  game: 'Error en el juego / Game error',
  letters: 'Letras / Letters',
  text: 'Texto / Text',
  translations: 'Traducciones / Translations',
  other: 'Otro / Other',
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeText(value: string) {
  return value
    .replace(/<\/?script[^>]*>/gi, '')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
    })
    .join('')
    .slice(0, MAX_DESCRIPTION_LENGTH)
    .trim();
}

function getFileExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  const dotIndex = lowerName.lastIndexOf('.');
  return dotIndex >= 0 ? lowerName.slice(dotIndex) : '';
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function generateReportId() {
  const randomPart = crypto.randomUUID().split('-')[0]!.toUpperCase();
  const datePart = new Date()
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, '');
  return `HOL-${datePart}-${randomPart}`;
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.SENDGRID_API_KEY) {
    return jsonResponse({ error: 'Report service is not configured.' }, 500);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: 'Invalid form submission.' }, 400);
  }

  const categoryRaw = String(formData.get('category') ?? 'other');
  const category = CATEGORY_LABELS[categoryRaw] ? categoryRaw : 'other';
  const descriptionRaw = String(formData.get('description') ?? '');
  const locale = String(formData.get('locale') ?? 'es') === 'en' ? 'en' : 'es';
  const description = sanitizeText(descriptionRaw);

  if (!description) {
    return jsonResponse({ error: 'Description is required.' }, 400);
  }

  const attachmentEntries = formData.getAll('attachment').filter((entry): entry is File => entry instanceof File);

  if (attachmentEntries.length > 5) {
    return jsonResponse({ error: 'Too many attachments.' }, 400);
  }

  let totalSize = 0;
  const emailAttachments: { filename: string; content: string; type: string }[] = [];
  const attachmentSummaries: string[] = [];

  for (const file of attachmentEntries) {
    const extension = getFileExtension(file.name);

    if (BLOCKED_EXTENSIONS.has(extension)) {
      return jsonResponse({ error: `File type not allowed: ${file.name}` }, 400);
    }

    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      return jsonResponse({ error: `File type not allowed: ${file.name}` }, 400);
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return jsonResponse({ error: `File too large: ${file.name}` }, 400);
    }

    totalSize += file.size;
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      return jsonResponse({ error: 'Total attachment size too large.' }, 400);
    }

    if (file.type.startsWith('text/') || file.type === 'application/json') {
      const textContent = await file.text();
      if (BLOCKED_TEXT_PATTERNS.some((pattern) => pattern.test(textContent))) {
        return jsonResponse({ error: `Suspicious content detected in: ${file.name}` }, 400);
      }
    }

    const buffer = await file.arrayBuffer();
    emailAttachments.push({
      filename: file.name,
      content: arrayBufferToBase64(buffer),
      type: file.type,
    });
    attachmentSummaries.push(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  }

  const categoryLabel = CATEGORY_LABELS[category] ?? CATEGORY_LABELS.other!;
  const reportId = generateReportId();
  const subject = `[HOLANDA #${reportId}] ${categoryLabel}`;
  const submittedAt = new Date().toISOString();

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
                  <p style="margin:0;color:#07111d;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">HOLANDA · Nuevo reporte</p>
                  <h1 style="margin:6px 0 0;color:#07111d;font-size:22px;">${escapeHtml(categoryLabel)}</h1>
                  <p style="margin:8px 0 0;color:#07111d;font-size:12px;font-weight:700;opacity:0.75;">Reporte #${escapeHtml(reportId)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Descripción</p>
                  <p style="margin:0 0 24px;color:#e2e8f0;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(description)}</p>

                  ${
                    attachmentSummaries.length
                      ? `<p style="margin:0 0 6px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Archivos adjuntos</p>
                  <ul style="margin:0 0 24px;padding-left:18px;color:#e2e8f0;font-size:14px;line-height:1.8;">
                    ${attachmentSummaries.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                  </ul>`
                      : `<p style="margin:0 0 24px;color:#64748b;font-size:13px;font-style:italic;">Sin archivos adjuntos.</p>`
                  }

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(148,163,184,0.2);padding-top:16px;margin-top:8px;">
                    <tr>
                      <td style="color:#64748b;font-size:12px;">Idioma: ${locale === 'es' ? 'Español' : 'English'}</td>
                      <td align="right" style="color:#64748b;font-size:12px;">${escapeHtml(submittedAt)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 28px;background-color:#0b1524;">
                  <p style="margin:0;color:#475569;font-size:11px;text-align:center;">Enviado automáticamente desde el formulario de reportes de HOLANDA.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  const text = `Nuevo reporte de HOLANDA\n\nNúmero de reporte: ${reportId}\n\nCategoría: ${categoryLabel}\n\nDescripción:\n${description}\n\nArchivos: ${
    attachmentSummaries.length ? attachmentSummaries.join(', ') : 'Ninguno'
  }\n\nFecha: ${submittedAt}`;

  const sendError = await sendEmail({
    apiKey: env.SENDGRID_API_KEY,
    from: { email: REPORT_EMAIL_FROM_ADDRESS, name: REPORT_EMAIL_FROM_NAME },
    to: [REPORT_EMAIL_TO],
    subject,
    html,
    text,
    attachments: emailAttachments.length ? emailAttachments : undefined,
  });

  if (sendError) {
    return jsonResponse({ error: 'Failed to send report email.', details: sendError }, 502);
  }

  return jsonResponse({ ok: true, reportId }, 200);
};
