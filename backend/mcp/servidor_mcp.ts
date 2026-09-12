// mcp/servidor_mcp.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'servidor-pension',
  version: '1.0.0',
});

server.registerTool(
  'simular_retiro_pension',
  {
    title: 'Simular retiro de pensión',
    description:
      'Calcula una proyección de saldo al retiro dado un ahorro actual, aportación mensual, tasa de interés anual y años restantes.',
    inputSchema: {
      ahorro_actual: z.number().describe('Ahorro acumulado hoy, en pesos'),
      aportacion_mensual: z.number().describe('Aportación mensual, en pesos'),
      tasa_anual: z.number().describe('Tasa de interés anual esperada, ej. 0.08 para 8%'),
      anios_restantes: z.number().int().describe('Años que faltan para el retiro'),
    },
  },
  async ({ ahorro_actual, aportacion_mensual, tasa_anual, anios_restantes }) => {
    // Interés compuesto mensual simple — datos de prueba, sin banco real todavía
    const tasaMensual = tasa_anual / 12;
    const meses = anios_restantes * 12;

    let saldo = ahorro_actual;
    for (let i = 0; i < meses; i++) {
      saldo = saldo * (1 + tasaMensual) + aportacion_mensual;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            saldo_proyectado: Math.round(saldo),
            anios_restantes,
            aportacion_mensual,
          }),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Error iniciando servidor MCP:', err);
  process.exit(1);
});