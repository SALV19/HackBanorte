// Hook de conexión al backend A2UI real. Extraído del smoke test
// descartable de PASO 6 (ver A2UI-ESTADO.md) — el patrón de conexión en sí
// (MessageProcessor construido una sola vez, suscripción de acciones vía el
// actionHandler del constructor, conversationId persistido en localStorage,
// freshSurface solo en la primera llamada de este montaje) ya está
// verificado end-to-end contra el backend real, incluyendo F5 a mitad de
// conversación. Este hook no reinventa nada de eso, solo lo empaqueta para
// que App.tsx (y cualquier otra pantalla futura) lo consuma sin repetirlo.
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageProcessor } from "@a2ui/web_core/v0_9";
import type { SurfaceModel, A2uiClientAction, A2uiMessage } from "@a2ui/web_core/v0_9";
import { reactCatalog } from "../a2ui/catalog";
import type { DiscardedComponent } from "../a2ui/types";

const CONV_STORAGE_KEY = "hackbanorte-a2ui-conversation-id";

export type ChatRole = "user" | "assistant" | "system" | "error";

export interface ChatEntry {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
}

export interface LogEntry {
  id: string;
  direction: "send" | "recv";
  label: string;
  data: unknown;
  timestamp: number;
}

export type A2uiStatus = "idle" | "loading" | "error";

interface UseA2uiOptions {
  userName: string;
}

interface UseA2uiResult {
  surface: SurfaceModel<any> | null;
  conversationId: string | undefined;
  status: A2uiStatus;
  errorMessage: string | null;
  messages: ChatEntry[];
  log: LogEntry[];
  discardedHistory: DiscardedComponent[];
  sendMessage: (content: string) => Promise<void>;
}

function makeId(): string {
  return Math.random().toString(36).slice(2);
}

const RED_DE_SERVIDOR = "No se pudo contactar al servidor (revisa que el backend esté corriendo).";

export function useA2ui({ userName }: UseA2uiOptions): UseA2uiResult {
  const processorRef = useRef<MessageProcessor<any> | null>(null);
  const [surface, setSurface] = useState<SurfaceModel<any> | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(() => localStorage.getItem(CONV_STORAGE_KEY) ?? undefined);
  const [status, setStatus] = useState<A2uiStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [discardedHistory, setDiscardedHistory] = useState<DiscardedComponent[]>([]);
  // Bandera por-montaje (no persistida): true solo en la primera llamada de
  // ESTE MessageProcessor recién creado, sin importar si conversationId ya
  // viene de localStorage — así un F5 a mitad de conversación se anuncia
  // correctamente como cliente fresco (ver A2UI-ESTADO.md, "surfaceId ==
  // conversationId" no depende de esto, pero freshSurface sí).
  const sentFirstRef = useRef(false);

  const appendLog = useCallback((direction: LogEntry["direction"], label: string, data: unknown) => {
    setLog((prev) => [...prev, { id: makeId(), direction, label, data, timestamp: Date.now() }]);
  }, []);

  const dispatchAction = useCallback(
    async (action: A2uiClientAction) => {
      appendLog("send", "POST /a2ui/action", action);
      try {
        const res = await fetch("/a2ui/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userName, action }),
        });
        const data = await res.json().catch(() => null);
        appendLog("recv", `/a2ui/action (${res.status})`, data);

        if (!res.ok || !data?.success) {
          const msg = data?.message ?? data?.errors?.[0]?.message ?? `Error ${res.status} en /a2ui/action`;
          setStatus("error");
          setErrorMessage(msg);
          return;
        }

        if (Array.isArray(data.a2uiMessages) && data.a2uiMessages.length > 0) {
          processorRef.current?.processMessages(data.a2uiMessages as A2uiMessage[]);
        }
      } catch (err) {
        appendLog("recv", "/a2ui/action (network error)", String(err));
        setStatus("error");
        setErrorMessage(RED_DE_SERVIDOR);
      }
    },
    [userName, appendLog]
  );

  useEffect(() => {
    const processor = new MessageProcessor([reactCatalog], (action) => dispatchAction(action));
    processorRef.current = processor;
    const sub = processor.onSurfaceCreated((model) => setSurface(model));
    return () => {
      sub.unsubscribe();
      processor.model.dispose();
    };
  }, [dispatchAction]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const freshSurface = !sentFirstRef.current;
      sentFirstRef.current = true;

      setMessages((prev) => [...prev, { id: makeId(), role: "user", text: trimmed, timestamp: Date.now() }]);
      setStatus("loading");
      setErrorMessage(null);

      const body = { userName, content: trimmed, conversationId, freshSurface };
      appendLog("send", "POST /mcp/chat", body);

      try {
        const res = await fetch("/mcp/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);
        appendLog("recv", `/mcp/chat (${res.status})`, data);

        if (!res.ok || !data?.success) {
          const msg = data?.message ?? data?.errors?.[0]?.message ?? `Error ${res.status} en /mcp/chat`;
          setStatus("error");
          setErrorMessage(msg);
          setMessages((prev) => [...prev, { id: makeId(), role: "error", text: msg, timestamp: Date.now() }]);
          // No revertimos sentFirstRef: un fallo del servidor ya recibido no
          // deja al cliente "sin freshSurface" en un estado inconsistente —
          // el siguiente intento sigue siendo, correctamente, no-fresh.
          return;
        }

        const { conversationId: newConversationId, mensaje, a2uiMessages, discarded } = data.message ?? {};

        if (newConversationId) {
          setConversationId(newConversationId);
          localStorage.setItem(CONV_STORAGE_KEY, newConversationId);
        }

        const hayMensaje = typeof mensaje === "string" && mensaje.length > 0;
        const hayComponentes = Array.isArray(a2uiMessages) && a2uiMessages.length > 0;

        if (hayMensaje) {
          setMessages((prev) => [...prev, { id: makeId(), role: "assistant", text: mensaje, timestamp: Date.now() }]);
        }
        if (!hayMensaje && !hayComponentes) {
          setMessages((prev) => [
            ...prev,
            { id: makeId(), role: "system", text: "(Respuesta vacía del servidor — sin mensaje ni componentes nuevos.)", timestamp: Date.now() },
          ]);
        }

        if (Array.isArray(discarded) && discarded.length > 0) {
          setDiscardedHistory((prev) => [...prev, ...discarded]);
        }

        if (hayComponentes) {
          processorRef.current?.processMessages(a2uiMessages as A2uiMessage[]);
        }

        setStatus("idle");
      } catch (err) {
        appendLog("recv", "/mcp/chat (network error)", String(err));
        setStatus("error");
        setErrorMessage(RED_DE_SERVIDOR);
        setMessages((prev) => [...prev, { id: makeId(), role: "error", text: RED_DE_SERVIDOR, timestamp: Date.now() }]);
      }
    },
    [userName, conversationId, appendLog]
  );

  return { surface, conversationId, status, errorMessage, messages, log, discardedHistory, sendMessage };
}
