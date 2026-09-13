import { useMemo, useState } from "react"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"
import CardContainer from "../atoms/CardContainer.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "./CardHeader.jsx"
import ScenarioOption from "./ScenarioOption.jsx"
import "../../css/molecules/scenario-comparison.css"

export default function ScenarioComparison({
  kicker,
  title,
  scenarios,
  selectedScenarioId,
  selectedLabel,
  action,
  onSelectScenario,
}) {
  const [internalSelected, setInternalSelected] = useState(selectedScenarioId || scenarios[0]?.id)
  const selectedId = selectedScenarioId || internalSelected
  const selected = scenarios.find((scenario) => scenario.id === selectedId) || scenarios[0]
  const data = useMemo(() => selected.chartMetrics, [selected])

  function handleSelect(id) {
    setInternalSelected(id)
    onSelectScenario?.(id)
  }

  return (
    <CardContainer className="scenario-comparison">
      <CardHeader action={action} kicker={kicker} title={title} />
      <div className="scenario-comparison__options">
        {scenarios.map((scenario) => (
          <ScenarioOption
            annualReturn={scenario.annualReturn}
            key={scenario.id}
            label={scenario.label}
            onSelect={() => handleSelect(scenario.id)}
            selected={scenario.id === selectedId}
          />
        ))}
      </div>
      <div className="scenario-comparison__chart">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.18} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {selectedLabel && <Text className="scenario-comparison__selected">{selectedLabel}: <strong>{selected.label}</strong></Text>}
    </CardContainer>
  )
}
