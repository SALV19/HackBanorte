// server.ts
import "dotenv/config";
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
