import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    if (window.matchMedia('(hover: none)').matches) return

    let raf = 0
    let mx = 0, my = 0

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        cursor.style.left = `${mx}px`
        cursor.style.top = `${my}px`
      })
    }

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button, a, .tilt-card, .glass-card, input, textarea, [role="button"]')) {
        cursor.classList.add('hovering')
      }
    }

    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button, a, .tilt-card, .glass-card, input, textarea, [role="button"]')) {
        cursor.classList.remove('hovering')
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <div ref={cursorRef} className="custom-cursor" />
}
