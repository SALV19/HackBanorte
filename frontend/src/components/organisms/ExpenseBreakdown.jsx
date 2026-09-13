import CardContainer from "../atoms/CardContainer.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "../molecules/CardHeader.jsx"
import ExpenseLegend from "../molecules/ExpenseLegend.jsx"
import { formatMXN } from "../../utils/formatters.js"
import "../../css/organisms/expense-breakdown.css"

export default function ExpenseBreakdown({ expenses, monthlyIncome }) {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const gradient = expenses.map((expense, index) => {
    const start = expenses.slice(0, index).reduce((sum, item) => sum + item.value, 0)
    const end = expenses.slice(0, index + 1).reduce((sum, item) => sum + item.value, 0)
    return `${expense.color} ${start}% ${end}%`
  }).join(", ")

  return (
    <CardContainer className="expense-breakdown">
      <CardHeader kicker="Tu vida hoy" title="Desglose de gastos" />
      <div className="expense-breakdown__content">
        <div className="expense-breakdown__donut" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="expense-breakdown__hole">
            <Text tone="primary" bold>{formatMXN(total / 1000)}k</Text>
            <Text size="sm" tone="muted">mensuales</Text>
          </div>
        </div>
        <ExpenseLegend expenses={expenses} />
      </div>
      {monthlyIncome && <Text tone="muted">Disponible estimado: {formatMXN(monthlyIncome - total)}</Text>}
    </CardContainer>
  )
}
