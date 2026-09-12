import express from "express";
import router from "./routes/router";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/", router);

export default app;
