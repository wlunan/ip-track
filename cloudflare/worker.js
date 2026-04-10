// Single-worker mode: serve static site + tracking API + preview page.
// Required binding: DB (D1 database)

const PREVIEW_PATH = '/_clock_view_9x2k7m'
const VISITOR_COOKIE_KEY = 'clock_visitor_id'

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

function formatChinaTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(date)

  const map = {}
  for (const part of parts) {
    map[part.type] = part.value
  }

  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function extractVisitorIdFromUrlString(urlString) {
  if (!urlString) return ''
  try {
    const url = new URL(String(urlString))
    const pathParts = url.pathname.split('/').filter(Boolean)
    const first = (pathParts[0] || '').trim()
    const second = (pathParts[1] || '').trim()

    if (first === 'track' && second) {
      return decodeURIComponent(second)
    }
    if (first && !first.startsWith('_') && first !== 'api') {
      return decodeURIComponent(first)
    }

    const queryId = (url.searchParams.get('id') || '').trim()
    return queryId ? decodeURIComponent(queryId) : ''
  } catch (error) {
    return ''
  }
}

function extractVisitorIdFromPathname(pathname) {
  const pathParts = String(pathname || '').split('/').filter(Boolean)
  const first = (pathParts[0] || '').trim()
  const second = (pathParts[1] || '').trim()

  if (first === 'track' && second) {
    return decodeURIComponent(second)
  }
  if (first && !first.startsWith('_') && first !== 'api') {
    return decodeURIComponent(first)
  }
  return ''
}

function getCookieValue(request, key) {
  const cookie = request.headers.get('Cookie') || ''
  const parts = cookie.split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (k === key) {
      return decodeURIComponent(rest.join('='))
    }
  }
  return ''
}

function resolveVisitorId(payload, request) {
  const payloadVisitorId = String(payload.visitorId || '').trim()
  if (payloadVisitorId && payloadVisitorId !== 'anonymous') {
    return payloadVisitorId
  }

  const fromPayloadUrl = extractVisitorIdFromUrlString(payload.url)
  if (fromPayloadUrl) {
    return fromPayloadUrl
  }

  const fromReferer = extractVisitorIdFromUrlString(request.headers.get('Referer'))
  if (fromReferer) {
    return fromReferer
  }

  const fromCookie = getCookieValue(request, VISITOR_COOKIE_KEY)
  if (fromCookie) {
    return fromCookie
  }

  return 'anonymous'
}

function renderPreviewHtml(visitorId, records = []) {
  const rows = records.length
    ? records.map((row) => `
      <tr>
        <td>${escapeHtml(row.visitor_id)}</td>
        <td>${escapeHtml(row.event_type)}</td>
        <td>${escapeHtml(row.ip_address)}</td>
        <td>${escapeHtml(row.device_user_agent)}</td>
        <td>${escapeHtml(row.country)}</td>
        <td>${escapeHtml(row.city)}</td>
        <td>${escapeHtml(row.visited_at)}</td>
        <td>${escapeHtml(row.url)}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="8">无数据</td></tr>'

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>访问记录预览</title>
    <style>
      body{font-family:Segoe UI,Arial,sans-serif;background:#f6f7fb;margin:0;padding:24px}
      .card{background:#fff;border-radius:12px;padding:16px;box-shadow:0 6px 24px rgba(0,0,0,.08)}
      h1{margin:0 0 12px;font-size:20px}
      .meta{color:#666;margin-bottom:12px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th,td{border:1px solid #e6e6e6;padding:8px;text-align:left;vertical-align:top;word-break:break-all}
      th{background:#f2f4f8}
      code{background:#f2f4f8;padding:2px 4px;border-radius:4px}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>访问记录预览</h1>
      <div class="meta">查询 visitor_id: <code>${escapeHtml(visitorId || '(未提供)')}</code></div>
      <table>
        <thead>
          <tr>
            <th>visitor_id</th>
            <th>event_type</th>
            <th>ip_address</th>
            <th>device_user_agent</th>
            <th>country</th>
            <th>city</th>
            <th>visited_at (中国时间)</th>
            <th>url</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </body>
</html>`
}

function pickFirstIp(value) {
  if (!value) return ''
  return String(value).split(',')[0].trim()
}

function getClientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('True-Client-IP') ||
    request.headers.get('X-Real-IP') ||
    pickFirstIp(request.headers.get('X-Forwarded-For')) ||
    ''
  )
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const isTrackingApi = url.pathname === '/api/track'
    const isPreviewPage = url.pathname === PREVIEW_PATH

    if (isPreviewPage) {
      const visitorId = String(url.searchParams.get('id') || '').trim()
      if (!visitorId) {
        return new Response('请使用 ?id=xxx 查询，例如 /_clock_view_9x2k7m?id=alice', { status: 400 })
      }

      if (!env.DB) {
        return new Response('DB binding missing', { status: 500 })
      }

      const result = await env.DB.prepare(
        `SELECT visitor_id, event_type, ip_address, device_user_agent, country, city, visited_at, url
         FROM click_events
         WHERE visitor_id = ?
         ORDER BY id DESC
         LIMIT 200`
      ).bind(visitorId).all()

      const html = renderPreviewHtml(visitorId, result.results || [])
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    // Serve static assets (Vue build output) for all non-API routes.
    if (!isTrackingApi) {
      if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
        // SPA fallback: extensionless paths like /alice should always load index.html.
        const pathname = url.pathname
        const isExtensionlessPath = !pathname.includes('.')
        if (request.method === 'GET' && isExtensionlessPath && pathname !== PREVIEW_PATH) {
          const visitorIdFromPath = extractVisitorIdFromPathname(pathname)
          const fallbackRequest = new Request(new URL('/index.html', request.url), request)
          const fallbackResponse = await env.ASSETS.fetch(fallbackRequest)

          if (!visitorIdFromPath) {
            return fallbackResponse
          }

          const headers = new Headers(fallbackResponse.headers)
          headers.append(
            'Set-Cookie',
            `${VISITOR_COOKIE_KEY}=${encodeURIComponent(visitorIdFromPath)}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`
          )
          return new Response(fallbackResponse.body, {
            status: fallbackResponse.status,
            statusText: fallbackResponse.statusText,
            headers
          })
        }

        const assetResponse = await env.ASSETS.fetch(request)
        if (assetResponse.status !== 404) {
          return assetResponse
        }

        // SPA fallback: /alice should render index.html.
        const fallbackRequest = new Request(new URL('/index.html', request.url), request)
        return env.ASSETS.fetch(fallbackRequest)
      }
      return new Response('Static assets not configured. Build frontend and set [assets].directory to dist.', { status: 500 })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, error: 'Method not allowed' }, 405)
    }

    let payload
    try {
      payload = await request.json()
    } catch (error) {
      return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400)
    }

    const visitorId = resolveVisitorId(payload, request)
    const eventType = String(payload.eventType || '').trim() || 'unknown'
    const ipAddress = getClientIp(request)
    const deviceUserAgent =
      String(payload.userAgent || '').trim() ||
      request.headers.get('User-Agent') ||
      ''
    const visitedAt = formatChinaTime()
    const country = request.cf?.country || ''
    const city = request.cf?.city || ''

    if (!env.DB) {
      // Fallback for quick verification if D1 is not bound yet.
      console.log('Tracking event (no DB binding):', payload)
      return jsonResponse({ ok: true, stored: false, reason: 'DB binding missing' })
    }

    try {
      await env.DB.prepare(
        `INSERT INTO click_events (
          visitor_id,
          event_type,
          ip_address,
          device_user_agent,
          country,
          city,
          visited_at,
          url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          visitorId,
          eventType,
          ipAddress,
          deviceUserAgent,
          country,
          city,
          visitedAt,
          payload.url || ''
        )
        .run()

      return jsonResponse({ ok: true, stored: true })
    } catch (error) {
      console.error('Insert failed:', error)
      return jsonResponse({ ok: false, error: 'Database insert failed' }, 500)
    }
  }
}
