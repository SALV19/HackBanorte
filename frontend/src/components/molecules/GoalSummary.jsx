import CardContainer from "../atoms/CardContainer.jsx"
import CurrencyText from "../atoms/CurrencyText.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "./CardHeader.jsx"
import ProgressRing from "./ProgressRing.jsx"
import "../../css/molecules/goal-summary.css"

export default function GoalSummary({
  kicker,
  title,
  currentValue,
  targetValue,
  bodyText,
  highlightText,
  footerLabel,
  action,
}) {
  const progress = targetValue <= 0 ? 0 : (currentValue / targetValue) * 100

  return (
    <CardContainer>
      <CardHeader action={action} kicker={kicker} title={title} />
      <div className="goal-summary__body">
        <ProgressRing value={progress} label={`${Math.round(progress)}%`} />
        <div className="goal-summary__copy">
          <Text>{bodyText}</Text>
          {highlightText && <Text tone="brand" bold>{highlightText}</Text>}
        </div>
      </div>
      <div className="goal-summary__footer">
        <Text tone="muted">{footerLabel}</Text>
        <CurrencyText amount={targetValue} size="sm" />
      </div>
    </CardContainer>
  )
}
