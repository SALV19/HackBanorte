// Frontend real de A2UI (shell + infraestructura). Reemplaza el smoke test
// descartable de PASO 6 — ver A2UI-ESTADO.md para el patrón de conexión que
// se extrajo de ahí (useA2ui) y qué falta (los 9 renderers de dominio, hoy
// DomainPlaceholder, van en un turno futuro).
import { Header } from "./components/organisms/Header";
import { ChatPanel } from "./components/organisms/ChatPanel";
import { SurfacePanel } from "./components/organisms/SurfacePanel";
import { DebugPanel } from "./components/organisms/DebugPanel";
import { useA2ui } from "./hooks/useA2ui";
import "./css/templates/app-layout.css";

// Usuario sembrado fijo (ver backend/data/seeder.ts). No hay selector de
// usuario todavía — fuera del alcance de este turno (shell + infraestructura
// de conexión, sin pantallas de producto).
const USER_NAME = "Alice Smith";

function App() {
  const { surface, status, errorMessage, messages, log, discardedHistory, sendMessage } = useA2ui({ userName: USER_NAME });

  return (
    <div className="app-layout">
      <Header />
      <main className="app-layout__body">
        <ChatPanel messages={messages} status={status} errorMessage={errorMessage} onSend={sendMessage} />
        <SurfacePanel surface={surface} status={status} />
      </main>
      <DebugPanel log={log} discarded={discardedHistory} />
    </div>
  );
}

export default App;
