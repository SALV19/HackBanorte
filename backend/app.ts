import express from "express";
import router from "./routes/router";
import path from 'node:path';
import { existsSync } from 'node:fs';

const app = express();

app.use(express.json({ limit: '32kb' }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/", router);

// En producción Express sirve el build de React desde el mismo origen.
const frontendDist = [path.resolve(__dirname, '../../frontend/dist'), path.resolve(__dirname, '../frontend/dist')]
  .find(directory => existsSync(path.join(directory, 'index.html')));
if (frontendDist) app.use(express.static(frontendDist));

export default app;
