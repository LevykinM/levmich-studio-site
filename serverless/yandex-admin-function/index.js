'use strict';

const crypto = require('node:crypto');

const MANIFEST_PATH = 'data/cases.generated.json';
const RESERVED_SLUGS = new Set(['front', 'three', 'wedding', 'main', 'admin', 'info']);

const env = (name, fallback = '') => process.env[name] || fallback;

const json = (statusCode, body, origin = '*') => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

const base64url = (value) => Buffer.from(value)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

const sign = (payload, secret) => crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('base64url');

const createToken = () => {
  const secret = env('ADMIN_SESSION_SECRET');
  const ttlHours = Number(env('ADMIN_SESSION_TTL_HOURS', '12'));
  const payload = base64url(JSON.stringify({
    sub: 'levmich-admin',
    exp: Date.now() + ttlHours * 60 * 60 * 1000,
  }));
  return `${payload}.${sign(payload, secret)}`;
};

const verifyToken = (authorization) => {
  const secret = env('ADMIN_SESSION_SECRET');
  const token = String(authorization || '').replace(/^Bearer\s+/i, '');
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !secret) return false;

  const expected = sign(payload, secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(data.exp) > Date.now();
  } catch {
    return false;
  }
};

const parseBody = (event) => {
  if (!event.body) return {};
  const source = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  return JSON.parse(source || '{}');
};

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const githubBase = () => {
  const owner = env('GITHUB_OWNER');
  const repo = env('GITHUB_REPO');
  if (!owner || !repo) throw new Error('GITHUB_OWNER and GITHUB_REPO are required.');
  return `https://api.github.com/repos/${owner}/${repo}`;
};

const githubRequest = async (method, path, body) => {
  const token = env('GITHUB_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN is required.');

  const response = await fetch(`${githubBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `GitHub API error ${response.status}`);
  }
  return data;
};

const getContent = async (path) => {
  const branch = env('GITHUB_BRANCH', 'main');
  try {
    const data = await githubRequest('GET', `/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(branch)}`);
    return {
      sha: data.sha,
      text: Buffer.from(data.content || '', 'base64').toString('utf8'),
    };
  } catch (error) {
    if (/not found/i.test(error.message)) return null;
    throw error;
  }
};

const putContent = async (path, content, message, sha) => {
  const branch = env('GITHUB_BRANCH', 'main');
  const body = {
    message,
    branch,
    content: Buffer.isBuffer(content) ? content.toString('base64') : Buffer.from(String(content), 'utf8').toString('base64'),
    ...(sha ? { sha } : {}),
  };
  return githubRequest('PUT', `/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, body);
};

const deleteContent = async (path, message) => {
  const current = await getContent(path);
  if (!current?.sha) return null;
  const branch = env('GITHUB_BRANCH', 'main');
  return githubRequest('DELETE', `/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, {
    message,
    branch,
    sha: current.sha,
  });
};

const readManifest = async () => {
  const current = await getContent(MANIFEST_PATH);
  if (!current) return { sha: null, data: { version: 1, updatedAt: null, cases: [] } };
  const data = JSON.parse(current.text || '{}');
  return {
    sha: current.sha,
    data: {
      version: 1,
      updatedAt: data.updatedAt || null,
      cases: Array.isArray(data.cases) ? data.cases : [],
    },
  };
};

const parseDataUrl = (dataUrl) => {
  const match = String(dataUrl || '').match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);
  if (!match) throw new Error('Cover must be a png, jpg or webp data URL.');
  const mime = match[1].toLowerCase();
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  return { buffer: Buffer.from(match[2], 'base64'), ext };
};

const kindLabel = (kind, lang) => {
  const labels = {
    branding: { ru: 'Брендинг', en: 'Branding' },
    site: { ru: 'Сайт', en: 'Website' },
    app: { ru: 'Приложение', en: 'App' },
    'branding-site': { ru: 'Брендинг и сайт', en: 'Branding and website' },
  };
  return labels[kind]?.[lang] || labels.site[lang];
};

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const generateCaseHtml = (item, lang) => {
  const title = lang === 'en' ? item.titleEn : item.titleRu;
  const summary = lang === 'en' ? item.summaryEn : item.summaryRu;
  const backHref = lang === 'en' ? '/en/main/' : lang === 'ru' ? '/ru/main/' : '/main/';
  const htmlLang = lang === 'en' ? 'en' : 'ru';
  const backText = lang === 'en' ? 'Back to main' : 'На главную';
  const caseText = lang === 'en' ? 'Generated case' : 'Кейс';

  return `<!doctype html>
<html lang="${htmlLang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${escapeHtml(title)} | Levmich Studio</title>
  <meta name="description" content="${escapeHtml(summary)}" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <style>
    @font-face{font-family:Onest;src:url('/Assets/fonts/Onest-VariableFont_wght.ttf') format('truetype-variations');font-weight:100 900;font-display:swap}
    *{box-sizing:border-box}body{margin:0;background:#050505;color:#fff;font-family:Onest,Arial,sans-serif}
    .case{min-height:100vh;padding:clamp(18px,4vw,54px);display:grid;gap:clamp(28px,5vw,72px)}
    .hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,46vw);gap:clamp(24px,4vw,64px);align-items:end}
    .copy{max-width:760px}.eyebrow{margin:0 0 14px;color:${item.accent};font-size:18px}.title{margin:0;font-size:clamp(56px,9vw,150px);font-weight:500;line-height:.9;letter-spacing:0}
    .summary{max-width:680px;margin:24px 0 0;color:rgba(255,255,255,.74);font-size:clamp(20px,2vw,30px);line-height:1.12}
    .cover{width:100%;aspect-ratio:4/5;overflow:hidden;border:1px solid rgba(255,255,255,.18);border-radius:40px;background:#151515}.cover img{width:100%;height:100%;object-fit:cover}
    .back{justify-self:start;display:inline-flex;align-items:center;justify-content:center;min-width:180px;height:58px;padding:0 28px;border-radius:24px;background:${item.accent};color:#000;text-decoration:none;font-size:18px;font-weight:500}
    @media(max-width:800px),(orientation:portrait){.hero{grid-template-columns:1fr}.cover{order:-1;border-radius:32px}.title{font-size:clamp(46px,15vw,86px)}.summary{font-size:20px}}
  </style>
</head>
<body>
  <main class="case">
    <section class="hero">
      <div class="copy">
        <p class="eyebrow">${escapeHtml(caseText)} · ${escapeHtml(kindLabel(item.kind, htmlLang))}</p>
        <h1 class="title">${escapeHtml(title)}</h1>
        <p class="summary">${escapeHtml(summary)}</p>
      </div>
      <figure class="cover"><img src="/${escapeHtml(item.cover)}" alt="${escapeHtml(title)}" /></figure>
    </section>
    <a class="back" href="${backHref}">${escapeHtml(backText)}</a>
  </main>
</body>
</html>
`;
};

const publishCase = async (payload) => {
  const slug = slugify(payload.slug);
  if (!slug || RESERVED_SLUGS.has(slug)) throw new Error('Choose another slug.');

  const titleRu = String(payload.titleRu || '').trim();
  const titleEn = String(payload.titleEn || '').trim();
  if (!titleRu || !titleEn) throw new Error('Both RU and EN titles are required.');

  const image = parseDataUrl(payload.coverDataUrl);
  const coverPath = `Assets/uploads/cases/${slug}/cover.${image.ext}`;
  const item = {
    slug,
    kind: payload.kind || 'site',
    titleRu,
    titleEn,
    summaryRu: String(payload.summaryRu || '').trim() || titleRu,
    summaryEn: String(payload.summaryEn || '').trim() || titleEn,
    accent: /^#[0-9a-f]{6}$/i.test(payload.accent || '') ? payload.accent : '#ff6b00',
    cover: coverPath,
    updatedAt: new Date().toISOString(),
  };

  const manifest = await readManifest();
  const cases = manifest.data.cases.filter(entry => entry.slug !== slug);
  cases.push(item);
  cases.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  const nextManifest = {
    version: 1,
    updatedAt: new Date().toISOString(),
    cases,
  };

  const message = `Publish case ${slug}`;
  await putContent(coverPath, image.buffer, message, (await getContent(coverPath))?.sha);
  const manifestCommit = await putContent(MANIFEST_PATH, `${JSON.stringify(nextManifest, null, 2)}\n`, message, manifest.sha);
  await putContent(`cases/${slug}/index.html`, generateCaseHtml(item, 'root'), message, (await getContent(`cases/${slug}/index.html`))?.sha);
  await putContent(`ru/cases/${slug}/index.html`, generateCaseHtml(item, 'ru'), message, (await getContent(`ru/cases/${slug}/index.html`))?.sha);
  await putContent(`en/cases/${slug}/index.html`, generateCaseHtml(item, 'en'), message, (await getContent(`en/cases/${slug}/index.html`))?.sha);

  return { item, commitSha: manifestCommit.commit?.sha || null };
};

const removeCase = async (slugRaw) => {
  const slug = slugify(slugRaw);
  if (!slug || RESERVED_SLUGS.has(slug)) throw new Error('This case cannot be deleted from admin.');

  const manifest = await readManifest();
  const item = manifest.data.cases.find(entry => entry.slug === slug);
  const nextCases = manifest.data.cases.filter(entry => entry.slug !== slug);
  const message = `Remove case ${slug}`;
  await putContent(MANIFEST_PATH, `${JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), cases: nextCases }, null, 2)}\n`, message, manifest.sha);

  if (item?.cover) await deleteContent(item.cover, message).catch(() => null);
  await deleteContent(`cases/${slug}/index.html`, message).catch(() => null);
  await deleteContent(`ru/cases/${slug}/index.html`, message).catch(() => null);
  await deleteContent(`en/cases/${slug}/index.html`, message).catch(() => null);
  return { slug };
};

module.exports.handler = async function handler(event) {
  const origin = env('ALLOWED_ORIGIN', '*');
  const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
  const query = event.queryStringParameters || event.params || {};
  const rawPath = query.route || query.path || event.path || event.url || '/';
  const path = rawPath.replace(/^https?:\/\/[^/]+/i, '').replace(/\/+$/, '') || '/';

  if (method === 'OPTIONS') return json(204, {}, origin);

  try {
    if (method === 'POST' && path.endsWith('/login')) {
      const body = parseBody(event);
      const commandOk = String(body.command || '') === env('ADMIN_COMMAND', '/admin');
      const passwordOk = String(body.password || '') === env('ADMIN_PASSWORD');
      if (!commandOk || !passwordOk || !env('ADMIN_PASSWORD') || !env('ADMIN_SESSION_SECRET')) {
        return json(401, { error: 'Команда или пароль не подошли.' }, origin);
      }
      return json(200, { token: createToken() }, origin);
    }

    if (method === 'GET' && path.endsWith('/cases')) {
      const manifest = await readManifest();
      return json(200, manifest.data, origin);
    }

    if (!verifyToken(event.headers?.authorization || event.headers?.Authorization)) {
      return json(401, { error: 'Нужен вход в админку.' }, origin);
    }

    if (method === 'POST' && path.endsWith('/cases')) {
      const result = await publishCase(parseBody(event));
      return json(200, result, origin);
    }

    if (method === 'DELETE' && /\/cases\/[^/]+$/.test(path)) {
      const slug = decodeURIComponent(path.split('/').pop());
      return json(200, await removeCase(slug), origin);
    }

    return json(404, { error: 'Route not found.' }, origin);
  } catch (error) {
    return json(500, { error: error.message || 'Server error.' }, origin);
  }
};
