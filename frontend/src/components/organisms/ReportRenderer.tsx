import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { A2uiMessage, ReportComponent, SimulationInput } from '../../../../shared/a2ui';
import Button from '../atoms/Button';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
const categoryNames: Record<string, string> = { Salary: 'Salario', Refund: 'Reembolsos', Investments: 'Inversiones', Freelance: 'Trabajo independiente', Utilities: 'Servicios', Health: 'Salud', Shopping: 'Compras', Entertainment: 'Entretenimiento', Food: 'Alimentación', Transport: 'Transporte' };
const label = (value: unknown) => categoryNames[String(value)] ?? String(value ?? '—');
type Row = Record<string, string | number>;
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter(v => v && typeof v === 'object') : [];

function resolveBinding(data: Record<string, unknown>, path: string): unknown {
  let value: unknown = data;
  for (const segment of path.split('/').slice(1)) {
    const key = segment.replace(/~1/g, '/').replace(/~0/g, '~');
    if (['__proto__', 'prototype', 'constructor'].includes(key) || !value || typeof value !== 'object' || !Object.hasOwn(value, key)) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function Chart({ component, value }: { component: Extract<ReportComponent, { component: 'Chart' }>; value: unknown }) {
  const points = rows(value);
  const [selected, setSelected] = useState<number | null>(null);
  const maximum = Math.max(1, ...points.flatMap(p => component.series.map(s => Number(p[s.key]) || 0)));
  const colors = ['#09685d', '#d45150', '#ba8719'];
  const chosen = points[selected ?? points.length - 1];
  return <section className="report-card chart-card">
    <div className="card-heading"><h3>{component.title}</h3><span className="unit-label">MXN</span></div>
    {!points.length ? <p className="empty-data">No hay datos para graficar en este periodo.</p> : <>
      <div className="chart-legend">{component.series.map((series, index) => <span key={series.key}><i style={{ background: colors[index % colors.length] }} />{series.label}</span>)}</div>
      {component.kind === 'bar' ? <div className="bar-chart">{points.map((point, index) => <button type="button" className="bar-row" key={`${point.label}-${index}`} onClick={() => setSelected(index)} aria-label={`${label(point.label)}: ${money.format(Number(point[component.series[0].key]))}`}>
        <span>{label(point.label)}</span><span className="bar-track"><span style={{ width: `${Math.max(0, Number(point[component.series[0].key]) / maximum * 100)}%` }} /></span><strong>{money.format(Number(point[component.series[0].key]))}</strong>
      </button>)}</div> : <>
        <svg className="line-chart" viewBox="0 0 640 225" role="img" aria-label={`${component.title}. Los valores están disponibles en los botones de periodo y la tabla desplegable.`}>
          {[0, 0.5, 1].map(tick => <g key={tick}><line x1="75" x2="620" y1={180 - tick * 150} y2={180 - tick * 150} stroke="#e6eae8" /><text x="65" y={184 - tick * 150} textAnchor="end">{new Intl.NumberFormat('es-MX', { notation: 'compact' }).format(maximum * tick)}</text></g>)}
          {component.series.map((series, seriesIndex) => <g key={series.key}>
            <polyline fill="none" stroke={colors[seriesIndex % colors.length]} strokeWidth="3" strokeLinejoin="round" points={points.map((point, i) => `${75 + i / Math.max(1, points.length - 1) * 540},${180 - Number(point[series.key]) / maximum * 150}`).join(' ')} />
            {points.map((point, i) => <circle key={i} cx={75 + i / Math.max(1, points.length - 1) * 540} cy={180 - Number(point[series.key]) / maximum * 150} r={i === selected ? 6 : 3.5} fill={colors[seriesIndex % colors.length]}><title>{`${label(point.label)} · ${series.label}: ${money.format(Number(point[series.key]))}`}</title></circle>)}
          </g>)}
        </svg>
        <div className="chart-periods">{points.map((point, i) => <button type="button" key={i} className={i === selected ? 'selected' : ''} onClick={() => setSelected(i)}>{label(point.label)}</button>)}</div>
        {chosen && <p className="chart-detail">{label(chosen.label)} · {component.series.map(s => `${s.label}: ${money.format(Number(chosen[s.key]))}`).join(' · ')}</p>}
      </>}
      <details className="chart-values"><summary>Ver valores de la gráfica</summary><div className="table-scroll"><table><thead><tr><th>Periodo / categoría</th>{component.series.map(s => <th key={s.key}>{s.label}</th>)}</tr></thead><tbody>{points.map((point, index) => <tr key={index}><td>{label(point.label)}</td>{component.series.map(s => <td key={s.key}>{money.format(Number(point[s.key]))}</td>)}</tr>)}</tbody></table></div></details>
    </>}
  </section>;
}

function RetirementForm({ title, disabled, onSubmit }: { title: string; disabled: boolean; onSubmit: (simulation: SimulationInput) => void }) {
  const fields = [
    { name: 'initialSavings', label: 'Ahorro actual (MXN)', max: 1e10, step: '0.01' },
    { name: 'monthlyContribution', label: 'Aportación mensual (MXN)', max: 1e8, step: '0.01' },
    { name: 'annualRate', label: 'Tasa anual del escenario (%)', max: 30, step: '0.01' },
    { name: 'years', label: 'Años de ahorro', max: 60, step: '1' },
  ];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    onSubmit(Object.fromEntries(fields.map(field => [field.name, Number(values.get(field.name))])) as unknown as SimulationInput);
  }
  return <form className="report-card" onSubmit={submit}><h3>{title}</h3><p className="muted">Completa tus supuestos para comparar cómo podría crecer tu ahorro.</p><div className="simulation-fields">{fields.map(field => <label key={field.name}>{field.label}<input type="number" name={field.name} required min={field.name === 'years' ? 1 : 0} max={field.max} step={field.step} disabled={disabled} /></label>)}</div><Button type="submit" disabled={disabled} className="primary-button">Calcular escenario</Button></form>;
}

export default function ReportRenderer({ messages, disabled, onMessage, onSimulate }: { messages: A2uiMessage[]; disabled: boolean; onMessage: (text: string) => void; onSimulate: (input: SimulationInput) => void }) {
  const created = messages.find(m => 'createSurface' in m);
  if (!created || !('createSurface' in created) || created.version !== 'v0.9' || created.createSurface.catalogId !== 'urn:hackbanorte:a2ui:report:v1') return <p role="alert">Este reporte usa un catálogo no compatible.</p>;
  const surfaceId = created.createSurface.surfaceId;
  const nodes = new Map<string, ReportComponent>();
  let data: Record<string, unknown> = {};
  for (const message of messages) {
    if ('updateComponents' in message && message.updateComponents.surfaceId === surfaceId) for (const node of message.updateComponents.components) nodes.set(node.id, node);
    if ('updateDataModel' in message && message.updateDataModel.surfaceId === surfaceId) data = message.updateDataModel.value;
  }
  function render(id: string, ancestors: string[] = []): ReactNode {
    if (ancestors.includes(id) || ancestors.length > 12) return null;
    const component = nodes.get(id);
    if (!component) return null;
    switch (component.component) {
      case 'Column': return <div key={id} className="report-grid">{component.children.map(child => render(child, [...ancestors, id]))}</div>;
      case 'Text': return <p key={id} className="report-note">{component.text}</p>;
      case 'Metric': {
        const value = resolveBinding(data, component.value.path);
        return <div className="report-card metric-card" key={id}><span>{component.label}</span><strong>{typeof value !== 'number' ? '—' : component.format === 'currency' ? money.format(value) : `${value}${component.format === 'percent' ? '%' : ''}`}</strong><small>{component.format === 'currency' ? 'Pesos mexicanos' : ''}</small></div>;
      }
      case 'Table': {
        const values = rows(resolveBinding(data, component.rows.path));
        return <section className="report-card table-card" key={id}><h3>{component.title}</h3>{values.length ? <div className="table-scroll"><table><thead><tr>{component.columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead><tbody>{values.map((row, i) => <tr key={i}>{component.columns.map(column => <td key={column.key} className={column.format === 'currency' ? 'numeric-cell' : ''}>{column.format === 'currency' ? money.format(Number(row[column.key])) : label(row[column.key])}</td>)}</tr>)}</tbody></table></div> : <p className="empty-data">No hay movimientos para estos filtros.</p>}</section>;
      }
      case 'Chart': return <Chart key={id} component={component} value={resolveBinding(data, component.data.path)} />;
      case 'Sources': {
        const sources = rows(resolveBinding(data, component.items.path));
        return <section className="report-card sources-card" key={id}><div className="card-heading"><h3>{component.title}</h3><span className="count-pill">{sources.length}</span></div>{sources.length ? sources.map((source, i) => <details className="source" key={String(source.id ?? i)}><summary><span className="source-icon">↗</span><span>{String(source.title)}</span><span className="muted">Ver documento</span></summary><p>{String(source.content)}</p></details>) : <p className="empty-data">No se recuperaron documentos relacionados para este perfil.</p>}</section>;
      }
      case 'ReportForm': return <RetirementForm key={id} title={component.title} disabled={disabled} onSubmit={onSimulate} />;
      case 'Suggestions': return <div className="report-suggestions" key={id}>{component.items.map(text => <Button key={text} type="button" className="suggestion-button" disabled={disabled} onClick={() => onMessage(text)}>{text}<span>↗</span></Button>)}</div>;
      default: return null;
    }
  }
  return <div className="a2ui-surface" data-surface-id={surfaceId}>{render('root')}</div>;
}
