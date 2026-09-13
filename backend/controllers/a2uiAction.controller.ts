import { Request, Response } from "express";
import { A2uiClientActionSchema } from "@a2ui/web_core/v0_9";
import { AppError } from "../types/error.type";
import handleA2uiAction from "../usecase/handleA2uiAction.usecase";

// A2uiClientActionSchema es zod v3 (viene de @a2ui/web_core, ver PASO 0.5) —
// se valida por separado de userName (zod v4 del resto del backend) en vez
// de componerlas en un solo schema, para no mezclar versiones de zod.
async function a2uiActionController(req: Request, res: Response) {
  try {
    const { userName, action } = (req.body ?? {}) as { userName?: unknown; action?: unknown };

    if (typeof userName !== "string" || userName.length === 0) {
      return res.status(400).json({
        errors: [{ field: "userName", message: "Debes seleccionar un perfil para poder interactuar" }],
      });
    }

    const parsedAction = A2uiClientActionSchema.safeParse(action);
    if (!parsedAction.success) {
      return res.status(400).json({
        errors: parsedAction.error.issues.map((issue: { path: (string | number)[]; message: string }) => ({
          field: issue.path.join(".") || "action",
          message: issue.message,
        })),
      });
    }

    const resultado = await handleA2uiAction({ userName, action: parsedAction.data });

    return res.status(200).json({ success: true, ...resultado });
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

export default a2uiActionController;
