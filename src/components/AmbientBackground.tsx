import { useEffect, useState } from 'react'

export function AmbientBackground() {
  const [particles, setParticles] = useState<{ left: number; delay: number; duration: number; size: number }[]>([])

  useEffect(() => {
    const arr = Array.from({ length: 8 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 5,
      size: 3 + Math.random() * 2,
    }))
    setParticles(arr)
  }, [])

  return (
    <div className="ambient-bg">
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />
      <div className="ambient-ribbon" />
      {particles.map((p, i) => (
        <div
          key={i}
          className="ambient-particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
