export function GradientDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5E78" />
          <stop offset="100%" stopColor="#E8B4A0" />
        </linearGradient>
        <linearGradient id="roseGradientHorizontal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF5E78" />
          <stop offset="100%" stopColor="#E8B4A0" />
        </linearGradient>
        <linearGradient id="roseGradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,94,120,0.25)" />
          <stop offset="100%" stopColor="rgba(255,94,120,0)" />
        </linearGradient>
        <linearGradient id="roseGoldArea" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(232,180,160,0.2)" />
          <stop offset="100%" stopColor="rgba(232,180,160,0)" />
        </linearGradient>
      </defs>
    </svg>
  )
}
