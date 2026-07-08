import { useCountUp } from '@/hooks/useCountUp'

interface ScoreRingProps {
  score: number
  size?: number
  stroke?: number
  label?: string
  showLabel?: boolean
}

export function ScoreRing({ score, size = 120, stroke = 8, label, showLabel = true }: ScoreRingProps) {
  const animatedScore = useCountUp(score)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="score-ring-container" style={{ width: size, height: size }}>
      <svg className="score-ring-svg" width={size} height={size}>
        <circle className="score-ring-bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="score-ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 700, color: 'var(--color-primary)' }}>
          {animatedScore}
        </span>
        {showLabel && label && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{label}</span>
        )}
      </div>
    </div>
  )
}
