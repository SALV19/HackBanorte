import CardContainer from "../atoms/CardContainer.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "./CardHeader.jsx"
import MetricTile from "./MetricTile.jsx"
import "../../css/molecules/timeline-summary.css"

export default function TimelineSummary({ kicker, title, points, metrics, helperText, action }) {
  const completed = points.filter((point) => point.completed).length
  const progress = points.length <= 1 ? 0 : ((completed - 1) / (points.length - 1)) * 100

  return (
    <CardContainer className="timeline-summary">
      <CardHeader action={action} kicker={kicker} title={title} />
      <div
        className="timeline-summary__rail"
        style={{ "--timeline-count": points.length, "--timeline-progress": `${Math.max(0, progress)}%` }}
      >
        {points.map((point) => (
          <div className="timeline-summary__point" key={`${point.label}-${point.value}`}>
            <span className="timeline-summary__dot" style={{ "--timeline-dot-color": point.color }} />
            <span className="timeline-summary__age">{point.value}</span>
            <span className="timeline-summary__label">{point.label}</span>
          </div>
        ))}
      </div>
      <div className="timeline-summary__metrics">
        {metrics.map((metric) => (
          <MetricTile
            amount={metric.amount}
            key={metric.label}
            label={metric.label}
            value={metric.value}
            variant={metric.variant}
          />
        ))}
      </div>
      {helperText && <Text tone="muted">{helperText}</Text>}
    </CardContainer>
  )
}
