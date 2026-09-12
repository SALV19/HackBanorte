import "dotenv/config";

import { GoogleGenAI } from "@google/genai";
import ollama from "ollama";
import { messageContent } from "../types/inputMessage.types";

async function runLLM(
  context: messageContent,
  provider: string = "ollama",
  model: string = "gemma3:1b",
) {
  const role = "Atención al cliente en un banco";
  const query = `Trabajas en atención al cliente y llega una persona de 
  ${context.age} años a preguntarte: ${context.content}. Ten en cuenta que el 
  usuario trabaja de ${context.job} y gana ${context.income} y gasta 
  ${context.expenses} mensualmente`;

  switch (provider) {
    case "gemini": {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: model,
        contents: query,
      });
      return response.text;
    }

    case "ollama": {
      const response = await ollama.chat({
        model: model, // e.g., 'gemma3:1b'
        messages: [{ role: role, content: query }],
      });
      return {
        text: response.message.content,
      };
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export default runLLM;
