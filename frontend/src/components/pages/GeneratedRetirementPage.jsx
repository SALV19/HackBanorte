import { useMemo, useState } from "react"
import Badge from "../atoms/Badge.jsx"
import Text from "../atoms/Text.jsx"
import Title from "../atoms/Title.jsx"
import ActionButton from "../organisms/ActionButton.jsx"
import AppHeader from "../organisms/AppHeader.jsx"
import ContributionSlider from "../organisms/ContributionSlider.jsx"
import ExpenseBreakdown from "../organisms/ExpenseBreakdown.jsx"
import GoalCard from "../organisms/GoalCard.jsx"
import MonthlyIncomeCard from "../organisms/MonthlyIncomeCard.jsx"
import ProjectionChart from "../organisms/ProjectionChart.jsx"
import RetirementTimeline from "../organisms/RetirementTimeline.jsx"
import ScenarioComparison from "../organisms/ScenarioComparison.jsx"
import { expensesData, projectionData, scenariosData } from "../../data/demoRetirementData.js"
import "../../css/pages/generated-retirement-page.css"

export default function GeneratedRetirementPage() {
  const [contribution, setContribution] = useState(7500)
  const [selectedScenarioId, setSelectedScenarioId] = useState("balanced")

  const contributionMessage = useMemo(
    () => contribution >= 10000 ? "Vas adelantando tu objetivo." : "Vas por buen camino.",
    [contribution],
  )

  return (
    <div className="generated-retirement-page">
      <AppHeader userName="Mariana" />
      <main className="generated-retirement-page__main" id="resumen">
        <section className="generated-retirement-page__hero">
          <div>
            <p className="generated-retirement-page__eyebrow">Tu espacio financiero</p>
            <h1 className="generated-retirement-page__title">Hola, Mariana</h1>
            <p className="generated-retirement-page__subtitle">
              Aquí tienes una vista clara de tu camino hacia el retiro.
            </p>
          </div>
          <Badge dot variant="success">Plan actualizado hoy</Badge>
        </section>

        <section className="generated-retirement-page__grid">
          <div className="generated-retirement-page__wide">
            <RetirementTimeline
              currentAge={28}
              currentSavings={180000}
              midpointAge={48}
              retirementAge={67}
              yearsToEnjoy={20}
            />
          </div>
          <GoalCard currentSavings={180000} retirementAge={67} targetSavings={7600000} yearsLeft={39} />
          <div className="generated-retirement-page__wide">
            <ProjectionChart data={projectionData} mode="area" />
          </div>
          <ContributionSlider max={15000} min={2500} onChange={setContribution} step={500} value={contribution} />
          <ScenarioComparison
            onSelectScenario={setSelectedScenarioId}
            scenarios={scenariosData}
            selectedScenarioId={selectedScenarioId}
          />
          <MonthlyIncomeCard monthlyIncome={45000} />
          <ExpenseBreakdown expenses={expensesData} monthlyIncome={45000} />
        </section>

        <section className="generated-retirement-page__cta" id="ayuda">
          <div className="generated-retirement-page__cta-copy">
            <Title size="sm">{contributionMessage}</Title>
            <Text>Pequeños cambios hoy pueden hacer una gran diferencia mañana.</Text>
          </div>
          <ActionButton
            action="confirmPlan"
            description="Revisa tu plan personalizado"
            label="Siguiente paso"
            onAction={(action, payload) => console.log("action_requested", { action, payload })}
          />
        </section>

        <p className="generated-retirement-page__disclaimer">
          Esta proyección es estimativa y no constituye asesoría financiera.
        </p>
      </main>
    </div>
  )
}
