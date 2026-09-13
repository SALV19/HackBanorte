import { GoogleGenAI, Content, Part } from "@google/genai";
import { toolDefinitions, executeTool } from "./tools";

// Inicialización del cliente de Gemini
const ai = new GoogleGenAI(); // Toma automáticamente GEMINI_API_KEY del entorno

const SYSTEM_PROMPT = `Eres un asistente financiero que genera reportes, series y predicciones
a partir de datos reales del usuario.

Reglas:
- NUNCA inventes cifras. Todo número que muestres debe venir de una tool.
- Si la solicitud del usuario requiere datos que ya obtuviste con una tool, no vuelvas a llamarla.
- Si la solicitud es ambigua (p. ej. no dice cuántos meses), asume un valor razonable (12 meses)
  y acláralo en la respuesta.
- Cuando termines de reunir los datos, responde ÚNICAMENTE con un JSON con esta forma:
  {
    "narrative": "resumen en lenguaje natural, breve y claro",
    "insights": ["hallazgo 1", "hallazgo 2"],
    "chart": {
      "type": "bar" | "line" | "line_with_forecast" | "none",
      "series": [ ... los datos ya obtenidos, tal cual, para que el frontend los grafique ... ]
    }
  }`;

interface AgentResponse {
  narrative: string;
  insights: string[];
  chart: {
    type: "bar" | "line" | "line_with_forecast" | "none";
    series: unknown[];
  };
}

export async function runAgent(
  query: string,
  userId: string,
): Promise<AgentResponse> {
  const contents: Content[] = [
    {
      role: "user",
      parts: [{ text: query }],
    },
  ];

  for (let step = 0; step < 5; step++) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: toolDefinitions }],
      },
    });

    const candidate = response.candidates?.[0];

    // Validar que exista el candidato y su contenido
    if (!candidate || !candidate.content) {
      throw new Error("No se obtuvo respuesta válida del modelo Gemini.");
    }

    // Solución al primer error: TypeScript ahora sabe que candidate.content no es undefined
    contents.push(candidate.content);

    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      return parseFinalResponse(response.text);
    }

    const toolResponseParts: Part[] = [];

    for (const call of functionCalls) {
      // Solución al segundo error: Proveer valores por defecto seguros
      const toolName = call.name ?? "";
      const toolArgs = (call.args as Record<string, any>) ?? {};

      if (!toolName) {
        continue; // Omitir si por algún motivo la llamada no tiene nombre
      }

      try {
        const result = await executeTool(toolName, toolArgs, { userId });
        toolResponseParts.push({
          functionResponse: {
            name: toolName,
            response: { result },
          },
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        toolResponseParts.push({
          functionResponse: {
            name: toolName,
            response: { error: errorMessage },
          },
        });
      }
    }

    contents.push({
      role: "user",
      parts: toolResponseParts,
    });
  }

  throw new Error(
    "El agente no llegó a una respuesta final tras varios pasos de tools.",
  );
}

function parseFinalResponse(text?: string): AgentResponse {
  if (!text) throw new Error("Respuesta vacía del modelo.");
  try {
    const json = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(json) as AgentResponse;
    if (!parsed.narrative || !Array.isArray(parsed.insights) || !parsed.chart) {
      throw new Error("JSON incompleto");
    }
    return parsed;
  } catch {
    // Si por algún motivo el formato no fue JSON estricto, devolvemos una estructura por defecto
    return {
      narrative: text,
      insights: [],
      chart: { type: "none", series: [] },
    };
  }
}
