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
import CardHeader from "../molecules/CardHeader.jsx"
import "../../css/organisms/projection-chart.css"

export default function ProjectionChart({ data, mode = "area" }) {
  return (
    <CardContainer id="proyeccion">
      <CardHeader
        action={(
          <div className="segmented-control" aria-label="Tipo de gráfica">
            <button className={mode === "area" ? "segmented-control__item segmented-control__item--active" : "segmented-control__item"} type="button">Área</button>
            <button className={mode === "line" ? "segmented-control__item segmented-control__item--active" : "segmented-control__item"} type="button">Líneas</button>
          </div>
        )}
        kicker="Proyección de crecimiento"
        title="Tu dinero con el tiempo"
      />
      <div className="projection-chart__chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="expectedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="age" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(value) => `${value}a`} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(value) => `${Number(value) / 1000000}M`} />
            <Tooltip formatter={(value) => formatMXN(Number(value))} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Area type="monotone" dataKey="optimistic" name="Optimista" stroke="var(--color-red-light)" fill="none" strokeWidth={2} />
            <Area type="monotone" dataKey="expected" name="Esperada" stroke="var(--color-primary)" fill={mode === "area" ? "url(#expectedFill)" : "none"} strokeWidth={2.5} />
            <Area type="monotone" dataKey="conservative" name="Conservadora" stroke="var(--color-gray-500)" fill="none" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContainer>
  )
}
