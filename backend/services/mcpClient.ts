// services/mcpClient.ts
import path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

let client: Client | null = null;

export async function connectMcp(): Promise<Client> {
  if (client) return client;

  const transport = new StdioClientTransport({
    command: process.execPath, // ruta al node.exe actual, sin depender de npx
    args: [require.resolve('tsx/cli'), path.join(__dirname, '../mcp/servidor_mcp.ts')],
  });

  const nuevoClient = new Client({ name: 'pension-backend', version: '1.0.0' });
  await nuevoClient.connect(transport);

  client = nuevoClient;
  return client;
}

export function getMcpClient(): Client {
  if (!client) {
    throw new Error('El cliente MCP no está conectado todavía. Llama a connectMcp() primero.');
  }
  return client;
}