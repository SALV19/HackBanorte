import { SlidersHorizontal, TrendingUp } from "lucide-react"
import CardContainer from "../atoms/CardContainer.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "../molecules/CardHeader.jsx"
import RangeSummary from "../molecules/RangeSummary.jsx"
import "../../css/organisms/contribution-slider.css"

export default function ContributionSlider({ value, min, max, step, onChange }) {
  return (
    <CardContainer className="contribution-slider">
      <CardHeader
        action={<SlidersHorizontal color="var(--color-text-muted)" aria-hidden="true" />}
        kicker="Ajusta tu estrategia"
        title="Aportación mensual"
      />
      <RangeSummary
        ariaLabel="Aportación mensual"
        badge={`+${Math.round(value / 2500)}% vs. actual`}
        max={max}
        min={min}
        onChange={onChange}
        step={step}
        suffix="al mes"
        value={value}
      />
      <div className="contribution-slider__note">
        <TrendingUp aria-hidden="true" />
        <Text>Con esta aportación alcanzarías tu meta en tiempo.</Text>
      </div>
    </CardContainer>
  )
}
