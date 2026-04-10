import { createApp } from 'vue'
import App from './App.vue'
import { initTracking } from './utils/tracking'
import { enableAntiDebug } from './utils/antiDebug'

const app = createApp(App)

app.mount('#app')

enableAntiDebug()

initTracking({
	endpoint: '/api/track'
})
