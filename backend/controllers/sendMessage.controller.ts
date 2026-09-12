import { Request, Response } from "express";
import { connectMcp } from "../services/mcpClient";
import runLLM from "../services/llm";

async function sendMessage(req: Request, res: Response) {
  const { message } = req.body;

  // const response = runLLM(process.env.PROVIDER, process.env.MODEL, )
}

export default sendMessage;
