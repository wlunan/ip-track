const BLOCKED_KEYS = new Set(['F12'])

function shouldBlockShortcut(event) {
  const key = String(event.key || '').toUpperCase()

  if (BLOCKED_KEYS.has(key)) return true

  // Ctrl/Cmd + Shift + I/J/C
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && ['I', 'J', 'C'].includes(key)) {
    return true
  }

  // Ctrl/Cmd + U (view source)
  if ((event.ctrlKey || event.metaKey) && key === 'U') {
    return true
  }

  return false
}

function installKeyBlocker() {
  document.addEventListener('keydown', (event) => {
    if (!shouldBlockShortcut(event)) return
    event.preventDefault()
    event.stopPropagation()
  }, true)
}

function installContextMenuBlocker() {
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault()
  })
}

function installDevtoolsDetector() {
  let warned = false

  const detect = () => {
    const widthGap = window.outerWidth - window.innerWidth
    const heightGap = window.outerHeight - window.innerHeight
    const opened = widthGap > 160 || heightGap > 160

    if (!opened) {
      if (warned) {
        document.body.style.removeProperty('filter')
      }
      warned = false
      return
    }

    if (warned) return
    warned = true
    // A lightweight visual deterrent when devtools are detected.
    document.body.style.filter = 'blur(6px)'
    console.clear()
    console.warn('Developer tools are restricted on this page.')
  }

  setInterval(detect, 800)
}

export function enableAntiDebug() {
  installKeyBlocker()
  installContextMenuBlocker()
  installDevtoolsDetector()
}
