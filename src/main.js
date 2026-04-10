import { createApp } from 'vue'
import App from './App.vue'
import { initTracking } from './utils/tracking'
import { enableAntiDebug } from './utils/antiDebug'

function shouldEnableTracking(pathname) {
	const hash = (window.location.hash || '').trim()
	const hashValue = hash.startsWith('#') ? hash.slice(1) : hash
	const hashPath = hashValue.split('?')[0]
	const hashFirst = (hashPath.split('/').filter(Boolean)[0] || '').trim().toLowerCase()
	if (hashFirst === 'query' || hashFirst === 'config') return false
	return true
}

const app = createApp(App)

app.mount('#app')

enableAntiDebug()

if (shouldEnableTracking(window.location.pathname)) {
	initTracking({
		endpoint: '/api/track'
	})
}
