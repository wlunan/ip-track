// Single-worker mode: serve static site + tracking/query APIs.
// Required binding: DB (D1 database)

const VISITOR_COOKIE_KEY = 'clock_visitor_id'
const RESERVED_PATH_SEGMENTS = new Set(['query', 'config', 'api'])
const WORKER_VERSION = 'route-t-no-redirect-20260410'

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

function isTrackCodePath(pathname) {
  const parts = String(pathname || '').split('/').filter(Boolean)
  if (parts.length !== 2) return false
  return (parts[0] || '').trim().toLowerCase() === 't' && Boolean((parts[1] || '').trim())
}

function isSpaPagePath(pathname) {
  if (pathname === '/' || pathname === '') return true
  return /^\/(_config|_query|config|query)(\/|$)/i.test(pathname)
}

function extractVisitorIdFromUrlString(urlString) {
  if (!urlString) return ''
  try {
    const url = new URL(String(urlString))
    const queryCode = (url.searchParams.get('t') || '').trim()
    if (queryCode) {
      return decodeURIComponent(queryCode)
    }

    const pathParts = url.pathname.split('/').filter(Boolean)
    const first = (pathParts[0] || '').trim()
    const second = (pathParts[1] || '').trim()

    if (first.toLowerCase() === 't' && second) {
      return decodeURIComponent(second)
    }
    return ''
  } catch (error) {
    return ''
  }
}

function extractVisitorIdFromPathname(pathname) {
  const pathParts = String(pathname || '').split('/').filter(Boolean)
  const first = (pathParts[0] || '').trim()
  const second = (pathParts[1] || '').trim()

  if (first.toLowerCase() === 't' && second) {
    return decodeURIComponent(second)
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
    const pathname = url.pathname

    if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    if (pathname === '/api/query-records') {
      const visitorId = String(url.searchParams.get('id') || '').trim()
      if (!visitorId) {
        return jsonResponse({ ok: false, error: 'Missing id' }, 400)
      }

      if (!env.DB) {
        return jsonResponse({ ok: false, error: 'DB binding missing' }, 500)
      }

      const result = await env.DB.prepare(
        `SELECT event_type, ip_address, country, city, visited_at, url
         FROM click_events
         WHERE visitor_id = ?
         ORDER BY id DESC
         LIMIT 300`
      ).bind(visitorId).all()

      return jsonResponse({
        ok: true,
        visitorId,
        records: result.results || []
      })
    }

    if (pathname === '/api/version') {
      return jsonResponse({ ok: true, version: WORKER_VERSION })
    }

    if (pathname === '/api/track') {
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

      if (!visitorId || visitorId === 'anonymous') {
        return jsonResponse({ ok: true, stored: false, reason: 'anonymous visitor ignored' })
      }

      if (!env.DB) {
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

    if (pathname.startsWith('/api/')) {
      return jsonResponse({ ok: false, error: 'Not found' }, 404)
    }

    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      const isExtensionlessPath = !pathname.includes('.')

      if (request.method === 'GET' && isExtensionlessPath) {
        if (isSpaPagePath(pathname)) {
          const fallbackRequest = new Request(new URL('/index.html', request.url), request)
          return env.ASSETS.fetch(fallbackRequest)
        }

        const visitorIdFromPath = extractVisitorIdFromPathname(pathname)
        if (visitorIdFromPath && isTrackCodePath(pathname)) {
          const fallbackRequest = new Request(new URL('/index.html', request.url), request)
          const fallbackResponse = await env.ASSETS.fetch(fallbackRequest)
          const headers = new Headers(fallbackResponse.headers)
          const secure = url.protocol === 'https:' ? '; Secure' : ''
          headers.append(
            'Set-Cookie',
            `${VISITOR_COOKIE_KEY}=${encodeURIComponent(visitorIdFromPath)}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`
          )
          return new Response(fallbackResponse.body, {
            status: fallbackResponse.status,
            statusText: fallbackResponse.statusText,
            headers
          })
        }

        const fallbackRequest = new Request(new URL('/index.html', request.url), request)
        return env.ASSETS.fetch(fallbackRequest)
      }

      const assetResponse = await env.ASSETS.fetch(request)
      if (assetResponse.status !== 404) {
        return assetResponse
      }

      const fallbackRequest = new Request(new URL('/index.html', request.url), request)
      return env.ASSETS.fetch(fallbackRequest)
    }

    return new Response('Static assets not configured. Build frontend and set [assets].directory to dist.', { status: 500 })
  }
}
