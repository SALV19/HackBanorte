import { TrendingUp } from "lucide-react"
import CardContainer from "../atoms/CardContainer.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "./CardHeader.jsx"
import RangeSummary from "./RangeSummary.jsx"
import "../../css/molecules/contribution-control.css"

export default function ContributionControl({
  kicker,
  title,
  value,
  min,
  max,
  step,
  badge,
  suffix,
  note,
  action,
  onChange,
}) {
  return (
    <CardContainer className="contribution-control">
      <CardHeader action={action} kicker={kicker} title={title} />
      <RangeSummary
        ariaLabel={title}
        badge={badge}
        max={max}
        min={min}
        onChange={onChange}
        step={step}
        suffix={suffix}
        value={value}
      />
      {note && (
        <div className="contribution-control__note">
          <TrendingUp aria-hidden="true" />
          <Text>{note}</Text>
        </div>
      )}
    </CardContainer>
  )
}
