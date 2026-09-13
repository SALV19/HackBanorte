import type { inputMessageType } from '../types/inputMessage.types';
import { UserDataAccess } from '../model/user.model';
import { ReportConversation } from '../model/conversation.model';
import { AppError } from '../types/error.type';
import { identifyIntent, explainReport } from '../services/llm';
import { vectorSearch } from './tools.uscase';
import { getFinanceReport, resolvePeriod } from '../mcp/db.tool';
import { buildReportUI } from '../views/report.builder';
import type { ReportNarrative, ReportPlan } from '../views/a2ui.schema';
import type { ChatReport } from '../../shared/a2ui';
import { basicIntent } from '../services/basicIntent';

export default async function processMessage(context: inputMessageType): Promise<ChatReport> {
  const user = await UserDataAccess.getUserByName(context.userName);
  if (!user) throw new AppError('No se encontró el perfil seleccionado', 'USER_NOT_FOUND', 404);
  const conversation = context.conversationId
    ? await ReportConversation.findOne({ _id: context.conversationId, id_user: user._id })
    : new ReportConversation({ id_user: user._id });
  if (!conversation) throw new AppError('La conversación no pertenece a este perfil o ya no existe', 'CONVERSATION_NOT_FOUND', 404);
  let plan: ReportPlan;
  let basicMode = false;
  const warnings: string[] = [];
  try {
    plan = await identifyIntent(context.content, conversation.messages.slice(-12).map(m => ({ role: m.role, content: m.content })));
  } catch (error) {
    console.error('No se pudo interpretar el mensaje:', error instanceof Error ? error.message : 'error');
    basicMode = true;
    let previous;
    try { previous = JSON.parse(conversation.messages.at(-1)?.content ?? '{}'); } catch { previous = undefined; }
    plan = basicIntent(context.content, previous);
    warnings.push('El modelo no está disponible. Se interpretó la consulta con reglas básicas; revisa la intención y el periodo mostrados. Los importes provienen de tus movimientos.');
  }
  if (context.simulation) { plan.intent = 'retiro'; plan.sections = [...new Set([...plan.sections, 'retirement' as const])]; }
  const period = resolvePeriod(plan);
  const [financeResult, documentResult] = await Promise.allSettled([
    getFinanceReport(String(user._id), plan, period),
    vectorSearch(plan.query, String(user._id)),
  ]);
  if (financeResult.status === 'rejected') throw new AppError('No se pudieron consultar tus movimientos. Inténtalo de nuevo.', 'FINANCE_UNAVAILABLE', 503);
  const finance = financeResult.value;
  const documents = documentResult.status === 'fulfilled' ? documentResult.value : [];
  if (documentResult.status === 'rejected') {
    warnings.push('La búsqueda de documentos no está disponible. Este reporte usa únicamente tus movimientos.');
    console.error('Vector Search no disponible:', documentResult.reason instanceof Error ? documentResult.reason.message : 'error');
  } else if (!documents.length) warnings.push('No se encontraron documentos para esta consulta y este perfil.');
  if (!finance.totals.count) warnings.push('No hay movimientos en el periodo y categoría consultados.');
  let narrative: ReportNarrative;
  try {
    if (basicMode) throw new Error('Modo básico');
    narrative = await explainReport({ content: context.content, plan, period, finance, documents });
  } catch {
    if (!basicMode) warnings.push('No se pudo generar la explicación automática. Las tablas y gráficas muestran los datos consultados.');
    const titles = { general: 'Tu panorama financiero', gastos: 'Así se distribuyen tus gastos', ingresos: 'De dónde vienen tus ingresos', ahorro: 'Tu capacidad de ahorro', retiro: 'Construye tu plan de retiro', documentos: 'Documentos para tu consulta' };
    narrative = { title: titles[plan.intent], summary: `Se consultaron ${finance.totals.count} movimientos entre ${period.from} y ${period.to}${plan.category ? ` de la categoría ${plan.category}` : ''}. Revisa el detalle y los documentos relacionados a continuación.`, sections: plan.sections, followUps: ['Muéstrame los movimientos en una tabla', 'Quiero simular un escenario de retiro'] };
  }
  const a2ui = buildReportUI(plan, narrative, finance, documents, context.simulation);
  conversation.messages.push(
    { role: 'user', content: context.content },
    { role: 'assistant', content: JSON.stringify({ summary: narrative.summary, intent: plan.intent, query: plan.query, period, category: plan.category, simulation: context.simulation }) },
  );
  // Guarda únicamente contexto textual y parámetros, sin duplicar los documentos.
  if (conversation.messages.length > 24) conversation.messages.splice(0, conversation.messages.length - 24);
  await conversation.save();
  return {
    conversationId: String(conversation._id), intent: plan.intent, title: narrative.title,
    summary: narrative.summary, period, warnings, documentCount: documents.length, a2ui,
  };
}
