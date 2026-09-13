import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import CardContainer from "../atoms/CardContainer.jsx"
import { formatMXN } from "../../utils/formatters.js"
import CardHeader from "./CardHeader.jsx"
import "../../css/molecules/projection-chart.css"

export default function ProjectionChart({ kicker, title, data, series, mode = "area", action }) {
  return (
    <CardContainer className="projection-chart">
      <CardHeader action={action} kicker={kicker} title={title} />
      <div className="projection-chart__chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
            <defs>
              {series.map((item) => (
                <linearGradient id={`${item.key}Fill`} key={item.key} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={item.color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={item.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="age" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(value) => `${value}a`} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(value) => `${Number(value) / 1000000}M`} />
            <Tooltip formatter={(value) => formatMXN(Number(value))} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            {series.map((item) => (
              <Area
                dataKey={item.key}
                fill={mode === "area" && item.fill ? `url(#${item.key}Fill)` : "none"}
                key={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={item.strokeWidth || 2}
                type="monotone"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContainer>
  )
}
