import { useEffect, useRef, type RefObject } from 'react'
import './Backdrop.css'

interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
}

/**
 * Embers drifting up off the hearth. Canvas rather than DOM nodes because a
 * hundred animated elements would thrash layout; this stays on the compositor
 * and costs about a millisecond a frame.
 */
function useEmbers(ref: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    // Read through the ref inside the effect: the node is mounted by now, and a
    // ref mutation would never have retriggered a dependency on `.current`.
    const canvas = ref.current
    if (!canvas) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let width = 0
    let height = 0
    const embers: Ember[] = []
    const COUNT = 64

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (ember: Ember, initial = false) => {
      ember.x = width * (0.12 + Math.random() * 0.76)
      ember.y = initial ? height * Math.random() : height + 12
      ember.vx = (Math.random() - 0.5) * 0.22
      ember.vy = -(0.18 + Math.random() * 0.55)
      ember.maxLife = 240 + Math.random() * 420
      ember.life = initial ? Math.random() * ember.maxLife : 0
      ember.size = 0.6 + Math.random() * 1.7
      ember.hue = 18 + Math.random() * 26
    }

    resize()
    for (let i = 0; i < COUNT; i++) {
      const ember = { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, hue: 0 }
      spawn(ember, true)
      embers.push(ember)
    }

    const frame = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      for (const ember of embers) {
        ember.life++
        if (ember.life > ember.maxLife || ember.y < -20) {
          spawn(ember)
          continue
        }

        // Slight sideways wander so the column never looks like a fountain.
        ember.vx += (Math.random() - 0.5) * 0.012
        ember.x += ember.vx
        ember.y += ember.vy

        const t = ember.life / ember.maxLife
        const alpha = t < 0.12 ? t / 0.12 : Math.max(0, 1 - (t - 0.12) / 0.88)

        ctx.beginPath()
        ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(${ember.hue} 100% ${58 + alpha * 22}% / ${alpha * 0.62})`
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [ref])
}

export function Backdrop() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEmbers(ref)

  return (
    <div className="backdrop" aria-hidden>
      <div className="backdrop__wall" />
      <div className="backdrop__plate" />
      <div className="backdrop__hearth" />
      <canvas ref={ref} className="backdrop__embers" />
      <div className="backdrop__grain" />
      <div className="backdrop__vignette" />
    </div>
  )
}
