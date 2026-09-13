import LegendDot from "../atoms/LegendDot.jsx"
import Text from "../atoms/Text.jsx"
import "../../css/molecules/expense-legend.css"

export default function ExpenseLegend({ expenses }) {
  return (
    <div className="expense-legend">
      {expenses.map((expense) => (
        <div className="expense-legend__item" key={expense.label}>
          <LegendDot color={expense.color} />
          <Text size="sm">{expense.label}</Text>
          <Text size="sm" tone="primary" bold>{expense.value}%</Text>
        </div>
      ))}
    </div>
  )
}
