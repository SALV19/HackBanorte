import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { ChatReport, Profile, SimulationInput } from '../../shared/a2ui';
import { getProfiles, sendChat } from './services/chat';
import ReportRenderer from './components/organisms/ReportRenderer';
import Button from './components/atoms/Button';
import './App.css';

type Entry = { id: string; role: 'user'; text: string } | { id: string; role: 'assistant'; report: ChatReport };
const examples = [
  { icon: '↗', title: 'Entiende tus gastos', text: 'Muéstrame mis gastos por categoría en una tabla y una gráfica' },
  { icon: '▥', title: 'Mira el panorama completo', text: 'Genera un reporte de mis ingresos y gastos de los últimos seis meses' },
  { icon: '◷', title: 'Planea tu retiro', text: 'Quiero planear mi retiro y simular un escenario de ahorro' },
];
const intentLabels: Record<string, string> = { general: 'Panorama financiero', gastos: 'Análisis de gastos', ingresos: 'Análisis de ingresos', ahorro: 'Plan de ahorro', retiro: 'Planeación de retiro', documentos: 'Consulta documental' };

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileName, setProfileName] = useState('');
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState<{ text: string; simulation?: SimulationInput }>();
  const request = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const profile = profiles.find(p => p.name === profileName);

  useEffect(() => {
    const controller = new AbortController();
    getProfiles(controller.signal).then(list => {
      setProfiles(list);
      setProfileName(list[0]?.name ?? '');
      setProfileError(list.length ? '' : 'No hay perfiles disponibles en la base de datos.');
    }).catch(error => {
      if (!controller.signal.aborted) setProfileError(error instanceof Error ? error.message : 'No se pudieron cargar los perfiles');
    }).finally(() => { if (!controller.signal.aborted) setProfilesLoading(false); });
    return () => controller.abort();
  }, [profileAttempt]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [entries, pending]);

  function reset(nextProfile = profileName) {
    request.current?.abort();
    request.current = null;
    setProfileName(nextProfile);
    setEntries([]); setConversationId(undefined); setError(''); setRetry(undefined);
    setContent(''); setPending(false);
  }

  async function submitMessage(text: string, simulation?: SimulationInput, isRetry = false) {
    if (!text.trim() || !profileName || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort('timeout'), 100000);
    setPending(true); setError(''); setRetry(undefined); setContent('');
    if (!isRetry) setEntries(previous => [...previous, { id: crypto.randomUUID(), role: 'user', text }]);
    try {
      const report = await sendChat({ userName: profileName, content: text.trim(), conversationId, simulation }, controller.signal);
      if (request.current !== controller) return;
      setConversationId(report.conversationId);
      setEntries(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', report }]);
    } catch (failure) {
      if (request.current !== controller) return;
      setError(controller.signal.aborted ? 'La consulta tardó demasiado. Puedes volver a intentarlo.' : failure instanceof Error ? failure.message : 'No se pudo conectar con el servidor.');
      setRetry({ text, simulation });
    } finally {
      clearTimeout(timer);
      if (request.current === controller) { request.current = null; setPending(false); }
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void submitMessage(content); }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="Inicio"><span className="brand-symbol">b</span><span>BANORTE<span className="brand-caption">Tu asesor financiero</span></span></a>
      <Button type="button" className="new-chat" onClick={() => reset()}><span>＋</span>Nueva consulta</Button>
      <div className="sidebar-section"><span className="eyebrow">TU ESPACIO</span><div className="nav-item active"><span>▤</span>Asistente financiero<span className="nav-dot" /></div></div>
      <div className="sidebar-note"><span className="note-icon">✦</span><h3>Una pregunta.<br />Una visión más clara.</h3><p>Conecta tus movimientos y documentos para entender mejor tus finanzas.</p></div>
      <div className="profile-panel"><label htmlFor="profile-select">Perfil de consulta</label><select id="profile-select" value={profileName} onChange={event => reset(event.target.value)} disabled={profilesLoading || !profiles.length}>{profilesLoading ? <option>Cargando perfiles…</option> : !profiles.length ? <option>Sin perfiles disponibles</option> : profiles.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>{profile && <p>{profile.job} · {profile.age} años</p>}<span className="demo-label">Perfiles de demostración</span></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div><span className="eyebrow">ASISTENTE FINANCIERO</span><p>Tus datos, con perspectiva.</p></div><span className="workspace-badge"><i />Espacio de consulta</span></header>
      <main className="conversation" aria-label="Conversación financiera">
        {profileError && <div className="error-box" role="alert"><p>{profileError}</p><Button type="button" onClick={() => { setProfilesLoading(true); setProfileError(''); setProfileAttempt(n => n + 1); }}>Volver a cargar perfiles</Button></div>}
        {!entries.length && <section className="welcome"><div className="welcome-mark">✦</div><span className="eyebrow">CLARIDAD PARA DECIDIR</span><h1>{profile ? `Hola, ${profile.name.split(' ')[0]}.` : 'Hablemos de tus finanzas.'}<br /><span>¿Qué quieres entender hoy?</span></h1><p>Pregunta sobre tus gastos, explora tus documentos o construye un plan de ahorro. Tu reporte toma forma contigo.</p><div className="example-grid">{examples.map(example => <button type="button" key={example.title} disabled={!profileName || pending} onClick={() => void submitMessage(example.text)}><span className="example-icon">{example.icon}</span><strong>{example.title}</strong><span>{example.text}</span><span className="example-arrow">↗</span></button>)}</div><div className="data-note"><i />Reportes basados en tus movimientos y documentos</div></section>}
        <div className="message-list">{entries.map(entry => entry.role === 'user' ? <div className="user-message" key={entry.id}><div>{entry.text}</div><span className="avatar">{profile?.name.charAt(0) ?? 'T'}</span></div> : <article className="assistant-message" key={entry.id}><div className="assistant-heading"><span className="assistant-avatar">✦</span><span>Tu asesor <small>REPORTE PERSONALIZADO</small></span></div><div className="report-header"><span className="intent-badge">{intentLabels[entry.report.intent] ?? entry.report.intent}</span><h2>{entry.report.title}</h2><div className="report-meta"><span>{entry.report.period.from} — {entry.report.period.to}</span><span>{entry.report.documentCount} documentos relacionados</span><button type="button" onClick={() => window.print()}>Imprimir / guardar PDF ↗</button></div><p>{entry.report.summary}</p></div>{entry.report.warnings.map(warning => <div className="report-warning" key={warning}>{warning}</div>)}<ReportRenderer messages={entry.report.a2ui} disabled={pending} onMessage={text => void submitMessage(text)} onSimulate={simulation => void submitMessage('Calcula mi escenario de retiro con estos parámetros', simulation)} /></article>)}</div>
        {pending && <div className="thinking" role="status"><span className="assistant-avatar">✦</span><div><strong>Preparando tu reporte<span className="loading-dots">…</span></strong><p>Interpretando tu consulta y revisando tus datos.</p></div></div>}
        {error && <div className="error-box" role="alert"><p>{error}</p>{retry && <Button type="button" disabled={pending} onClick={() => void submitMessage(retry.text, retry.simulation, true)}>Reintentar consulta</Button>}</div>}
        <div ref={end} />
      </main>
      <footer className="composer-area"><form className="composer" onSubmit={submit}><label htmlFor="chat-input" className="sr-only">Tu pregunta financiera</label><textarea id="chat-input" value={content} maxLength={4000} rows={2} onChange={event => setContent(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submitMessage(content); } }} placeholder={profileName ? 'Por ejemplo: ¿en qué gasté más el mes pasado?' : 'Selecciona un perfil para comenzar'} disabled={pending || !profileName} /><Button type="submit" className="send-button" disabled={pending || !profileName || !content.trim()}><span className="sr-only">Enviar mensaje</span>↑</Button></form><p>Enter para enviar · Shift + Enter para una nueva línea<span>Consulta informativa con datos de demostración</span></p></footer>
    </div>
  </div>;
}
export default App;
