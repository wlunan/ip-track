import { ref, computed } from 'vue'
import { messages, defaultLocale } from '../locales'

const currentLocale = ref(localStorage.getItem('locale') || defaultLocale)

export function useI18n() {
  const locale = computed({
    get: () => currentLocale.value,
    set: (val) => {
      currentLocale.value = val
      localStorage.setItem('locale', val)
    }
  })

  const t = (key) => {
    const keys = key.split('.')
    let value = messages[currentLocale.value]
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key
      }
    }
    
    return value || key
  }

  const switchLocale = (newLocale) => {
    if (messages[newLocale]) {
      locale.value = newLocale
    }
  }

  const availableLocales = Object.keys(messages)

  return {
    locale,
    t,
    switchLocale,
    availableLocales
  }
}
