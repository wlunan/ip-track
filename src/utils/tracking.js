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

  const sendEvent = (eventType, extra = {}) => {
    const payload = {
      ...buildBasePayload(visitorId),
      eventType,
      ...extra
    }
    postTracking(workerEndpoint, payload)
  }

  // Only record page open event to keep the data concise.
  sendEvent('page_view')
}
