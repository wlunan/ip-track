<template>
  <div class="scene" @click="onSceneClick">
    <canvas ref="canvasRef" class="fireworks-canvas"></canvas>

    <div class="stars">
      <span
        v-for="star in stars"
        :key="star.id"
        class="star"
        :style="{
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: `${star.s}px`,
          height: `${star.s}px`,
          animationDelay: `${star.delay}s`,
          animationDuration: `${star.duration}s`
        }"
      ></span>
    </div>

    <div class="aurora"></div>
    <div class="streaks"></div>

    <button
      class="settings-fab"
      :class="{ active: !panelCollapsed }"
      :title="panelCollapsed ? t('fireworks.openSettings') : t('fireworks.closeSettings')"
      @click.stop="togglePanel"
    >
      {{ panelCollapsed ? '⚙' : '✕' }}
    </button>

    <header v-show="!panelCollapsed" class="hud" @click.stop>
      <div class="brand">
        <h1>{{ t('fireworks.title') }}</h1>
        <p>{{ t('fireworks.subtitle') }}</p>
      </div>

      <div class="controls-row">
        <button class="lang-btn" @click.stop="switchLocaleFn('zh-CN')" :class="{ active: locale === 'zh-CN' }">{{ t('common.zh') }}</button>
        <button class="lang-btn" @click.stop="switchLocaleFn('en-US')" :class="{ active: locale === 'en-US' }">{{ t('common.en') }}</button>
        <button class="ctrl-btn" @click.stop="autoPlay = !autoPlay" :class="{ active: autoPlay }">
          {{ autoPlay ? t('fireworks.autoOn') : t('fireworks.autoOff') }}
        </button>
        <button class="ctrl-btn launch" @click.stop="launchNow">{{ t('fireworks.launch') }}</button>
      </div>

      <div class="types">
        <button
          v-for="type in fireworkTypes"
          :key="type.id"
          class="type-btn"
          :class="{ active: selectedType === type.id }"
          @click.stop="selectedType = type.id"
        >
          {{ t(type.labelKey) }}
        </button>
      </div>
    </header>

    <p class="line">{{ t('fireworks.line') }}</p>
  </div>
</template>

<script>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from '../composables/useI18n'

export default {
  setup () {
    const { t, locale, switchLocale } = useI18n()
    const canvasRef = ref(null)
    const autoPlay = ref(true)
    const selectedType = ref('random')
    const panelCollapsed = ref(true)

    const fireworkTypes = [
      { id: 'random', labelKey: 'fireworks.types.random' },
      { id: 'chrysanthemum', labelKey: 'fireworks.types.chrysanthemum' },
      { id: 'ring', labelKey: 'fireworks.types.ring' },
      { id: 'palm', labelKey: 'fireworks.types.palm' },
      { id: 'willow', labelKey: 'fireworks.types.willow' },
      { id: 'crackle', labelKey: 'fireworks.types.crackle' }
    ]

    const stars = Array.from({ length: 56 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 75,
      s: 0.8 + Math.random() * 2.2,
      delay: Math.random() * 6,
      duration: 2.8 + Math.random() * 5.6
    }))

    let rafId = 0
    let rockets = []
    let particles = []
    let dpr = 1
    let width = 0
    let height = 0
    let ctx = null
    let lastAuto = 0

    const pickType = () => {
      if (selectedType.value !== 'random') return selectedType.value
      const pool = ['chrysanthemum', 'ring', 'palm', 'willow', 'crackle']
      return pool[Math.floor(Math.random() * pool.length)]
    }

    const resize = () => {
      if (!canvasRef.value || !ctx) return
      dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      canvasRef.value.width = Math.floor(width * dpr)
      canvasRef.value.height = Math.floor(height * dpr)
      canvasRef.value.style.width = `${width}px`
      canvasRef.value.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const makeRocket = (x, targetY, type, spread = 0.65) => ({
      x,
      y: height + 20,
      vx: (Math.random() - 0.5) * spread,
      vy: -7.6 - Math.random() * 1.6,
      targetY,
      type,
      hue: Math.random() * 360,
      life: 0
    })

    const pushParticle = (opts) => {
      particles.push({
        alpha: 1,
        friction: 0.985,
        gravity: 0.038,
        size: 1.8,
        twinkle: false,
        ...opts,
        prevX: opts.x,
        prevY: opts.y,
        spawned: false
      })
    }

    const explode = (rocket) => {
      if (rocket.type === 'ring') {
        const count = 96
        for (let i = 0; i < count; i += 1) {
          const angle = (Math.PI * 2 * i) / count
          const speed = 3.2 + Math.random() * 0.7
          pushParticle({
            x: rocket.x,
            y: rocket.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            hue: rocket.hue + Math.random() * 14,
            gravity: 0.022,
            friction: 0.989,
            size: 1.7 + Math.random(),
            twinkle: true
          })
        }
        return
      }

      if (rocket.type === 'palm') {
        const count = 58
        for (let i = 0; i < count; i += 1) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.15
          const speed = 2.4 + Math.random() * 4.6
          pushParticle({
            x: rocket.x,
            y: rocket.y,
            vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.3),
            vy: Math.sin(angle) * speed,
            hue: 36 + Math.random() * 25,
            gravity: 0.052,
            friction: 0.982,
            size: 1.8 + Math.random() * 1.6,
            twinkle: true
          })
        }
        return
      }

      if (rocket.type === 'willow') {
        const count = 88
        for (let i = 0; i < count; i += 1) {
          const angle = Math.random() * Math.PI * 2
          const speed = 1.3 + Math.random() * 2.7
          pushParticle({
            x: rocket.x,
            y: rocket.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            hue: 42 + Math.random() * 26,
            gravity: 0.028,
            friction: 0.993,
            size: 1.4 + Math.random() * 1.8,
            twinkle: true
          })
        }
        return
      }

      const count = rocket.type === 'crackle' ? 100 : 78
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.06
        const speed = 1.6 + Math.random() * 4.8
        pushParticle({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          hue: rocket.hue + (Math.random() * 26 - 13),
          friction: rocket.type === 'crackle' ? 0.978 : 0.986,
          gravity: 0.032 + Math.random() * 0.018,
          size: 1.2 + Math.random() * 2.2,
          twinkle: rocket.type === 'crackle',
          crackle: rocket.type === 'crackle'
        })
      }
    }

    const launchBurst = (x, y, count = 1) => {
      const type = pickType()
      for (let i = 0; i < count; i += 1) {
        const offset = (Math.random() - 0.5) * 84
        rockets.push(makeRocket(x + offset, y + Math.random() * 36, type, 0.75))
      }
    }

    const spawnAuto = (timestamp) => {
      if (!autoPlay.value) return
      if (timestamp - lastAuto < 720) return
      lastAuto = timestamp

      const x = width * (0.12 + Math.random() * 0.76)
      const targetY = height * (0.2 + Math.random() * 0.45)
      rockets.push(makeRocket(x, targetY, pickType()))

      if (Math.random() > 0.68) {
        rockets.push(makeRocket(x + (Math.random() - 0.5) * 90, targetY + Math.random() * 40, pickType(), 0.9))
      }
    }

    const step = (timestamp) => {
      if (!ctx) return

      spawnAuto(timestamp)

      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(4, 8, 18, 0.2)'
      ctx.fillRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'lighter'

      const nextRockets = []
      for (let i = 0; i < rockets.length; i += 1) {
        const r = rockets[i]
        r.life += 1
        r.x += r.vx
        r.y += r.vy
        r.vy += 0.03

        ctx.beginPath()
        ctx.arc(r.x, r.y, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${r.hue}, 100%, 70%, 0.95)`
        ctx.fill()

        if (r.y <= r.targetY || r.vy > -0.08 || r.life > 90) {
          explode(r)
        } else {
          nextRockets.push(r)
        }
      }
      rockets = nextRockets

      const nextParticles = []
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i]
        p.prevX = p.x
        p.prevY = p.y
        p.vx *= p.friction
        p.vy *= p.friction
        p.vy += p.gravity
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.013 + Math.random() * 0.004

        if (p.crackle && !p.spawned && p.alpha < 0.58) {
          p.spawned = true
          for (let j = 0; j < 3; j += 1) {
            const angle = Math.random() * Math.PI * 2
            const speed = 0.8 + Math.random() * 1.6
            pushParticle({
              x: p.x,
              y: p.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              hue: p.hue + Math.random() * 20,
              gravity: 0.045,
              friction: 0.972,
              size: 0.8 + Math.random() * 1.3,
              alpha: 0.58
            })
          }
        }

        if (p.alpha > 0.02) {
          ctx.beginPath()
          ctx.moveTo(p.prevX, p.prevY)
          ctx.lineTo(p.x, p.y)
          ctx.strokeStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha * 0.3})`
          ctx.lineWidth = Math.max(0.6, p.size * 0.35)
          ctx.stroke()

          const blink = p.twinkle && Math.random() > 0.72 ? 0.08 : 0
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${p.hue}, 100%, 68%, ${Math.max(0, p.alpha - blink)})`
          ctx.fill()
          nextParticles.push(p)
        }
      }
      particles = nextParticles

      rafId = requestAnimationFrame(step)
    }

    const onSceneClick = (event) => {
      const baseX = event.clientX
      const baseY = event.clientY
      launchBurst(baseX, Math.max(64, baseY - 30), 3)
    }

    const launchNow = () => {
      launchBurst(width * (0.2 + Math.random() * 0.6), height * (0.24 + Math.random() * 0.25), 4)
    }

    const switchLocaleFn = (newLocale) => {
      switchLocale(newLocale)
    }

    const togglePanel = () => {
      panelCollapsed.value = !panelCollapsed.value
    }

    onMounted(() => {
      if (!canvasRef.value) return
      ctx = canvasRef.value.getContext('2d')
      if (!ctx) return

      resize()
      window.addEventListener('resize', resize)

      ctx.fillStyle = 'rgb(4, 8, 18)'
      ctx.fillRect(0, 0, width, height)
      rafId = requestAnimationFrame(step)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
      rockets = []
      particles = []
    })

    return {
      t,
      locale,
      stars,
      autoPlay,
      selectedType,
      panelCollapsed,
      fireworkTypes,
      canvasRef,
      onSceneClick,
      launchNow,
      switchLocaleFn,
      togglePanel
    }
  }
}
</script>

<style lang="less" scoped>
* {
  box-sizing: border-box;
}

.scene {
  position: fixed;
  inset: 0;
  overflow: hidden;
  cursor: crosshair;
  background: radial-gradient(circle at 50% 110%, #361156 0%, #150b2b 28%, #080b1f 60%, #03040b 100%);
}

.settings-fab {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 8;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 227, 179, 0.42);
  border-radius: 50%;
  background: rgba(15, 19, 44, 0.72);
  color: #ffeecf;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: all 0.2s ease;
}

.settings-fab:hover,
.settings-fab.active {
  color: #220f08;
  border-color: transparent;
  background: rgba(255, 200, 122, 0.92);
}

.fireworks-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.stars {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.star {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 245, 226, 0.95);
  box-shadow: 0 0 8px rgba(255, 228, 171, 0.66);
  animation-name: twinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.aurora {
  position: absolute;
  inset: -10%;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 75%, rgba(254, 107, 139, 0.2) 0%, transparent 45%),
    radial-gradient(circle at 75% 25%, rgba(122, 174, 255, 0.16) 0%, transparent 46%),
    radial-gradient(circle at 60% 85%, rgba(255, 192, 90, 0.15) 0%, transparent 52%);
  filter: blur(24px);
  animation: breathe 7s ease-in-out infinite;
}

.streaks {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background-image:
    linear-gradient(115deg, transparent 0 44%, rgba(255, 255, 255, 0.18) 46%, transparent 49%),
    linear-gradient(120deg, transparent 0 68%, rgba(255, 240, 198, 0.12) 70%, transparent 73%);
  background-size: 140% 140%;
  background-position: 110% 0, -20% 100%;
  mix-blend-mode: screen;
  animation: drift 10s linear infinite;
}

.hud {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 66px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding-right: 6px;
}

.brand h1 {
  margin: 0;
  color: #fff3db;
  font-size: clamp(20px, 3.4vw, 34px);
  letter-spacing: 0.06em;
  text-shadow: 0 0 16px rgba(253, 197, 101, 0.4);
}

.brand p {
  margin: 6px 0 0;
  color: rgba(255, 239, 213, 0.9);
  font-size: clamp(12px, 1.8vw, 16px);
}

.controls-row,
.types {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.lang-btn,
.ctrl-btn,
.type-btn {
  border: 1px solid rgba(255, 227, 179, 0.42);
  background: rgba(15, 19, 44, 0.52);
  color: #ffeecf;
  border-radius: 999px;
  padding: 7px 13px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.launch {
  background: rgba(255, 152, 64, 0.2);
}

.lang-btn.active,
.ctrl-btn.active,
.type-btn.active,
.lang-btn:hover,
.ctrl-btn:hover,
.type-btn:hover {
  color: #220f08;
  border-color: transparent;
  background: rgba(255, 200, 122, 0.92);
}

.line {
  position: absolute;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
  transform: translateX(-50%);
  z-index: 4;
  margin: 0;
  color: rgba(255, 244, 220, 0.95);
  text-align: center;
  letter-spacing: 0.06em;
  font-size: clamp(14px, 2.5vw, 22px);
  text-shadow: 0 0 12px rgba(255, 205, 116, 0.45);
  padding: 0 16px;
}

@keyframes drift {
  0% {
    background-position: 110% 0, -20% 100%;
  }
  100% {
    background-position: -25% 100%, 120% -10%;
  }
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.24;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.98;
    transform: scale(1.15);
  }
}

@media (max-width: 640px) {
  .scene {
    cursor: default;
  }

  .settings-fab {
    width: 42px;
    height: 42px;
    top: 10px;
    right: 10px;
    font-size: 19px;
  }

  .hud {
    top: 12px;
    left: 12px;
    right: 58px;
    gap: 8px;
  }

  .brand h1 {
    font-size: clamp(18px, 6vw, 26px);
  }

  .brand p {
    font-size: 12px;
  }

  .controls-row,
  .types {
    gap: 6px;
  }

  .lang-btn,
  .ctrl-btn,
  .type-btn {
    font-size: 12px;
    padding: 9px 12px;
  }

  .line {
    width: calc(100% - 20px);
    bottom: calc(env(safe-area-inset-bottom, 0px) + 14px);
    font-size: clamp(13px, 4vw, 18px);
  }
}
</style>
