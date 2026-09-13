import type { ChatReport, Profile, SimulationInput } from '../../../shared/a2ui';

async function readResponse(response: Response) {
  let data;
  try { data = await response.json(); }
  catch { throw new Error('El servidor no devolvió una respuesta válida. Comprueba que el backend esté iniciado.'); }
  if (!response.ok || !data.success) {
    throw new Error(data.errors?.map((issue: { message: string }) => issue.message).join('. ') || data.message || 'No se pudo completar la solicitud');
  }
  return data;
}

export async function getProfiles(signal: AbortSignal): Promise<Profile[]> {
  const data = await readResponse(await fetch('/mcp/profiles', { signal }));
  if (!Array.isArray(data.profiles)) throw new Error('No se recibieron los perfiles');
  return data.profiles;
}

export async function sendChat(input: { userName: string; content: string; conversationId?: string; simulation?: SimulationInput }, signal: AbortSignal): Promise<ChatReport> {
  const data = await readResponse(await fetch('/mcp/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal,
  }));
  if (!data.message || !Array.isArray(data.message.a2ui)) throw new Error('El servidor no envió un reporte válido');
  return data.message;
}
