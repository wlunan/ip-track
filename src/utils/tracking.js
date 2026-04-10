const DEFAULT_EVENT_VERSION = 1

function getVisitorId() {
  try {
    const url = new URL(window.location.href)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const first = (pathParts[0] || '').trim()
    const second = (pathParts[1] || '').trim()

    // Preferred route style: /track/:id
    if (first === 'track' && second) {
      return decodeURIComponent(second)
    }

    // Also support simple style: /:id
    if (first && !first.startsWith('_')) {
      return decodeURIComponent(first)
    }

    // Backward compatible fallback for old links: ?id=xxx
    const queryId = (url.searchParams.get('id') || '').trim()
    return queryId || 'anonymous'
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
