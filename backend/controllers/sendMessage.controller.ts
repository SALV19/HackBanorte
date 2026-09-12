import { Request, Response } from "express";
import { inputMessage } from "../types/inputMessage.types";
import { AppError } from "../types/error.type";
import processMessage from "../usecase/poccessMessage.usecase";

async function sendMessage(req: Request, res: Response) {
  try {
    const result = inputMessage.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues.map((issue) => ({
          field: issue.path[0],
          message: issue.message,
        })),
      });
    }

    const intention = await processMessage(result.data);

    return res.status(200).json({ success: true, message: intention });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "Ocurrió un error en el servidor",
    });
  }
}

export default sendMessage;
