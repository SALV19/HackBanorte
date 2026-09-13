export interface Profile { id: string; name: string; age: number; job: string }
export type Intent = 'general' | 'gastos' | 'ingresos' | 'ahorro' | 'retiro' | 'documentos';
export interface SimulationInput { initialSavings: number; monthlyContribution: number; annualRate: number; years: number }
export interface Binding { path: string }
export type ReportComponent =
  | { id: string; component: 'Column'; children: string[] }
  | { id: string; component: 'Text'; text: string; variant?: 'h2' | 'body' }
  | { id: string; component: 'Metric'; label: string; value: Binding; format: 'currency' | 'number' | 'percent' }
  | { id: string; component: 'Table'; title: string; rows: Binding; columns: { key: string; label: string; format?: 'currency' }[] }
  | { id: string; component: 'Chart'; title: string; data: Binding; kind: 'bar' | 'line'; series: { key: string; label: string }[] }
  | { id: string; component: 'Sources'; title: string; items: Binding }
  | { id: string; component: 'ReportForm'; title: string }
  | { id: string; component: 'Suggestions'; items: string[] };
export type A2uiMessage = { version: 'v0.9' } & (
  | { createSurface: { surfaceId: string; catalogId: string } }
  | { updateComponents: { surfaceId: string; components: ReportComponent[] } }
  | { updateDataModel: { surfaceId: string; path: '/'; value: Record<string, unknown> } }
);
export interface ChatReport {
  conversationId: string;
  intent: Intent;
  title: string;
  summary: string;
  period: { from: string; to: string };
  warnings: string[];
  documentCount: number;
  a2ui: A2uiMessage[];
}
