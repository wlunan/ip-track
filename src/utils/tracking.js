const DEFAULT_EVENT_VERSION = 1
function getVisitorId() {
  try {
    const hash = (window.location.hash || '').trim()
    const hashValue = hash.startsWith('#') ? hash.slice(1) : hash
    const hashPath = hashValue.split('?')[0]
    const hashParts = hashPath.split('/').filter(Boolean)
    const hashFirst = (hashParts[0] || '').trim().toLowerCase()
    const hashSecond = (hashParts[1] || '').trim()

    if (hashFirst === 't' && hashSecond) {
      return decodeURIComponent(hashSecond)
    }

    const pathParts = window.location.pathname.split('/').filter(Boolean)
    const first = (pathParts[0] || '').trim().toLowerCase()
    const second = (pathParts[1] || '').trim()
    if (first === 't' && second) {
      return decodeURIComponent(second)
    }

    return 'anonymous'
  } catch (error) {
    console.warn('Failed to parse URL for visitor id:', error)
    return 'anonymous'
  }
}

function normalizeEndpoint(endpoint) {
  if (!endpoint) return ''
  return endpoint.trim().replace(/\/$/, '')
}

function postTracking(endpoint, payload) {
  const body = JSON.stringify(payload)

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon(endpoint, blob)
    return
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch((error) => {
    console.warn('Tracking request failed:', error)
  })
}

function buildBasePayload(visitorId) {
  return {
    version: DEFAULT_EVENT_VERSION,
    visitorId,
    url: window.location.href,
    path: window.location.pathname,
    query: window.location.search,
    title: document.title,
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    timestamp: new Date().toISOString()
  }
}

/**
 * 通过 ip.sb API 获取客户端公网 IPv4/IPv6 地址
 * 使用 AbortSignal.timeout 控制超时，避免阻塞页面
 */
async function fetchClientIps() {
  const results = { ipv4: '', ipv6: '', city: '' }
  const tasks = [
    fetch('https://api-ipv4.ip.sb/ip', { signal: AbortSignal.timeout(3000) })
      .then(r => r.text())
      .then(ip => { if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip.trim())) results.ipv4 = ip.trim() })
      .catch(() => {}),
    fetch('https://api-ipv6.ip.sb/ip', { signal: AbortSignal.timeout(3000) })
      .then(r => r.text())
      .then(ip => { if (ip && ip.includes(':')) results.ipv6 = ip.trim() })
      .catch(() => {})
  ]
  await Promise.allSettled(tasks)
  // 获取 IPv4 后，查询城市信息（使用 ip.sb 地理位置 API）
  if (results.ipv4) {
    try {
      const res = await fetch(`https://api.ip.sb/geoip/${results.ipv4}`, { signal: AbortSignal.timeout(3000) })
      const geo = await res.json()
      if (geo.city) results.city = geo.city
    } catch (_) {}
  }
  return results
}

export function initTracking({ endpoint = '' } = {}) {
  const workerEndpoint = normalizeEndpoint(endpoint)
  if (!workerEndpoint) {
    console.info('Tracking disabled: VUE_APP_TRACKING_WORKER_URL is empty')
    return
  }

  const visitorId = getVisitorId()
  if (!visitorId || visitorId === 'anonymous') {
    return
  }

  const sendEvent = async (eventType, extra = {}) => {
    const ips = await fetchClientIps()
    const payload = {
      ...buildBasePayload(visitorId),
      eventType,
      clientIpv4: ips.ipv4,
      clientIpv6: ips.ipv6,
      clientCity: ips.city,
      ...extra
    }
    postTracking(workerEndpoint, payload)
  }

  // Only record page open event to keep the data concise.
  sendEvent('page_view')
}
