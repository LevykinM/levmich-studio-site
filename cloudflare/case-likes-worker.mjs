const SUPABASE_URL = 'https://gacdatugndetlxndhvmw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nhxed07wBJ_QvIQnnlrMZA_K2fvsgjB';
const ALLOWED_SLUGS = new Set(['limo', 'three', 'wedding', 'front']);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

function supabaseHeaders(contentType = false) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function readCounts() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/case_likes?select=case_slug,likes_count`, {
    headers: supabaseHeaders(),
    cf: { cacheTtl: 10, cacheEverything: true },
  });
  const text = await response.text();
  if (!response.ok) {
    return json({ error: 'supabase_counts_failed', details: text }, { status: response.status });
  }
  return new Response(text, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=10, stale-while-revalidate=60',
      ...corsHeaders,
    },
  });
}

async function toggleLike(request) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'invalid_json' }, { status: 400 });
  }

  const slug = String(body.case_slug || body.slug || '').trim();
  const visitorHash = String(body.visitor_hash || body.visitorHash || '').trim();

  if (!ALLOWED_SLUGS.has(slug)) {
    return json({ error: 'invalid_case_slug' }, { status: 400 });
  }
  if (!visitorHash) {
    return json({ error: 'missing_visitor_hash' }, { status: 400 });
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/toggle_case_like`, {
    method: 'POST',
    headers: supabaseHeaders(true),
    body: JSON.stringify({
      p_case_slug: slug,
      p_visitor_hash: visitorHash,
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    return json({ error: 'supabase_toggle_failed', details: text }, { status: response.status });
  }

  return new Response(text || 'null', {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const isLikesPath = url.pathname === '/case-likes' || url.pathname === '/api/case-likes';
    if (!isLikesPath) {
      return json({ ok: true, endpoint: '/case-likes' });
    }

    if (request.method === 'GET') return readCounts();
    if (request.method === 'POST') return toggleLike(request);

    return json({ error: 'method_not_allowed' }, {
      status: 405,
      headers: { Allow: 'GET,POST,OPTIONS' },
    });
  },
};
