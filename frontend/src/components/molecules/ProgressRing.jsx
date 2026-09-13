import "../../css/molecules/progress-ring.css"

export default function ProgressRing({ value, max = 100, label }) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="progress-ring" aria-label={`${Math.round(percent)} por ciento alcanzado`}>
      <svg viewBox="0 0 40 40">
        <circle className="progress-ring__track" cx="20" cy="20" fill="none" r="16" strokeWidth="4" />
        <circle
          className="progress-ring__value"
          cx="20"
          cy="20"
          fill="none"
          r="16"
          strokeDasharray={`${percent} 100`}
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <span className="progress-ring__label">{label || `${Math.round(percent)}%`}</span>
    </div>
  )
}
