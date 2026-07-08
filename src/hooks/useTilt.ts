import { useEffect, useRef } from 'react'

export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const card = ref.current
    if (!card) return
    if (window.matchMedia('(hover: none)').matches) return

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      card.style.transform = `perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(4px)`
    }

    const onLeave = () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)'
      card.style.transition = 'transform 0.5s ease'
    }

    const onEnter = () => {
      card.style.transition = 'transform 0.1s ease'
    }

    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', onLeave)
    card.addEventListener('mouseenter', onEnter)

    return () => {
      card.removeEventListener('mousemove', onMove)
      card.removeEventListener('mouseleave', onLeave)
      card.removeEventListener('mouseenter', onEnter)
    }
  }, [])

  return ref
}
