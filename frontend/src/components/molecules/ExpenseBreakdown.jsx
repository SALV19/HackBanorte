import CardContainer from "../atoms/CardContainer.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "./CardHeader.jsx"
import ExpenseLegend from "./ExpenseLegend.jsx"
import "../../css/molecules/expense-breakdown.css"

export default function ExpenseBreakdown({ kicker, title, expenses, centerValue, centerLabel, footerText }) {
  const gradient = expenses.map((expense, index) => {
    const start = expenses.slice(0, index).reduce((sum, item) => sum + item.value, 0)
    const end = expenses.slice(0, index + 1).reduce((sum, item) => sum + item.value, 0)
    return `${expense.color} ${start}% ${end}%`
  }).join(", ")

  return (
    <CardContainer className="expense-breakdown">
      <CardHeader kicker={kicker} title={title} />
      <div className="expense-breakdown__content">
        <div className="expense-breakdown__donut" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="expense-breakdown__hole">
            <Text tone="primary" bold>{centerValue}</Text>
            <Text size="sm" tone="muted">{centerLabel}</Text>
          </div>
        </div>
        <ExpenseLegend expenses={expenses} />
      </div>
      {footerText && <Text tone="muted">{footerText}</Text>}
    </CardContainer>
  )
}
