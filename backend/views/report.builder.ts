import { randomUUID } from 'node:crypto';
import type { A2uiMessage, ReportComponent, SimulationInput } from '../../shared/a2ui';
import { CATALOG_ID, type ReportNarrative, type ReportPlan } from './a2ui.schema';
import type { FinanceReport } from '../mcp/db.tool';
import type { RetrievedDocument } from '../usecase/tools.uscase';
import { simulateRetirement } from '../services/retirement';

export function buildReportUI(plan: ReportPlan, narrative: ReportNarrative, finance: FinanceReport, documents: RetrievedDocument[], simulation?: SimulationInput): A2uiMessage[] {
  const surfaceId = randomUUID();
  const components: ReportComponent[] = [];
  const data: Record<string, unknown> = {
    totals: finance.totals, categories: finance.categories, monthly: finance.monthly,
    transactions: finance.transactions,
    documents: documents.map(d => ({ ...d, content: d.content.slice(0, 6000) })),
  };
  const selected = new Set([...plan.sections, ...narrative.sections]);
  if (documents.length) selected.add('documents');
  if (plan.intent === 'retiro') selected.add('retirement');
  for (const section of selected) {
    switch (section) {
      case 'metrics':
        components.push(
          { id: 'income', component: 'Metric', label: 'Ingresos del periodo', value: { path: '/totals/income' }, format: 'currency' },
          { id: 'expenses', component: 'Metric', label: 'Gastos del periodo', value: { path: '/totals/expenses' }, format: 'currency' },
          { id: 'balance', component: 'Metric', label: 'Balance del periodo', value: { path: '/totals/balance' }, format: 'currency' },
        );
        break;
      case 'categories': {
        const title = plan.intent === 'ingresos' ? 'Ingresos por categoría' : 'Gastos por categoría';
        components.push(
          { id: 'category-chart', component: 'Chart', title, kind: 'bar', data: { path: '/categories' }, series: [{ key: 'value', label: 'Importe' }] },
          { id: 'category-table', component: 'Table', title: 'Detalle por categoría', rows: { path: '/categories' }, columns: [{ key: 'label', label: 'Categoría' }, { key: 'value', label: 'Importe', format: 'currency' }] },
        );
        break;
      }
      case 'monthly':
        components.push({ id: 'monthly', component: 'Chart', title: 'Evolución mensual', kind: 'line', data: { path: '/monthly' }, series: [{ key: 'income', label: 'Ingresos' }, { key: 'expenses', label: 'Gastos' }] });
        break;
      case 'transactions':
        components.push({ id: 'transactions', component: 'Table', title: `Movimientos recientes · ${finance.transactions.length} de ${finance.totals.count}`, rows: { path: '/transactions' }, columns: [{ key: 'date', label: 'Fecha' }, { key: 'reason', label: 'Concepto' }, { key: 'category', label: 'Categoría' }, { key: 'amount', label: 'Importe', format: 'currency' }] });
        break;
      case 'documents':
        components.push({ id: 'sources', component: 'Sources', title: 'Documentos relacionados', items: { path: '/documents' } });
        break;
      case 'retirement':
        if (simulation) {
          const projection = simulateRetirement(simulation);
          data.projection = projection;
          components.push(
            { id: 'projection-value', component: 'Metric', label: 'Saldo proyectado en el escenario', value: { path: '/projection/finalBalance' }, format: 'currency' },
            { id: 'projection-chart', component: 'Chart', title: 'Escenario de ahorro', kind: 'line', data: { path: '/projection/points' }, series: [{ key: 'value', label: 'Saldo proyectado' }] },
            { id: 'assumptions', component: 'Text', text: `Supuestos: ahorro inicial ${simulation.initialSavings} MXN, aportación mensual ${simulation.monthlyContribution} MXN, tasa anual ${simulation.annualRate}% y plazo de ${simulation.years} años. Capitalización mensual y aportaciones al final de cada mes. No incluye inflación, comisiones ni impuestos. Es un escenario, no un rendimiento garantizado.` },
          );
        }
        components.push({ id: 'retirement-form', component: 'ReportForm', title: simulation ? 'Ajusta tu escenario' : 'Construye tu escenario de retiro' });
        break;
    }
  }
  if (narrative.followUps.length) components.push({ id: 'follow-ups', component: 'Suggestions', items: narrative.followUps });
  components.unshift({ id: 'root', component: 'Column', children: components.map(c => c.id) });
  return [
    { version: 'v0.9', createSurface: { surfaceId, catalogId: CATALOG_ID } },
    { version: 'v0.9', updateDataModel: { surfaceId, path: '/', value: data } },
    { version: 'v0.9', updateComponents: { surfaceId, components } },
  ];
}
