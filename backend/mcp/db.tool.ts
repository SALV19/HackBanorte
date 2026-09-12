import { ollama } from "ai-sdk-ollama";
import { generateText } from "ai";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// TODO Yessi
const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "mongodb-mcp-server@latest", "run"],
});

const mcpClient = new Client(
  { name: "mongo-db", version: "1.0.0" },
  { capabilities: {} },
);

async function handleUserReportRequest(userPrompt: string) {
  const response = await generateText({
    model: ollama("gemma3:1b"),
    tools: convertMcpToolsToAiSdk(tools), // Adaptar herramientas MCP
    system:
      "Eres un asistente de BI. Usa las herramientas de MongoDB para consultar las colecciones necesarias y generar el reporte.",
    prompt: userPrompt,
    maxSteps: 5, // Permite que la IA haga múltiples consultas a MongoDB si requiere unir colecciones
  });

  return response.text;
}

async function connectMongoMCP() {
  await mcpClient.connect(transport);

  const tools = await mcpClient.listTools();
  console.log(`Mongo MCP tools: ${tools}`);

  return mcpClient;
}

export function disconnectMongoMCP() {
  mcpClient.close();
  console.log("Connection to MongoMCP closed");
}

export default connectMongoMCP;
