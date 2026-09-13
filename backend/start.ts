// start.ts
//
// La lógica real vive aquí (no en server.ts) porque TypeScript/tsx sube
// (hoist) todos los `import` al inicio del archivo compilado, sin importar
// en qué línea del código fuente están escritos — así que un `config()` de
// dotenv intercalado entre imports en el mismo archivo nunca corre a tiempo
// (los módulos que dependen de esas variables ya se cargaron antes). Por eso
// server.ts hace el `config()` con un `require()` plano (que sí respeta el
// orden en el que se escribe) y solo después trae este archivo.
import app from "./app";
import { connectMcp } from "./services/mcpClient";
import { mongoDB } from "./services/mongoDb";

const PORT = process.env.PORT || 3000;

async function start() {
  await mongoDB();
  const mcp = await connectMcp();
  const { tools } = await mcp.listTools();
  console.log(
    "Tools MCP descubiertas:",
    tools.map((t) => t.name),
  );

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

start();
