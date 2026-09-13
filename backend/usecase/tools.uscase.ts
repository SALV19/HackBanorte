import { Types } from "mongoose";
import { DocumentModel } from "../model/documents.model";
import { AppError } from "../types/error.type";

export interface RetrievedDocument {
  title: string;
  content: string;
  category: string;
  score: number;
}

/** Atlas genera el embedding de query con el modelo autoEmbed del índice. */
export async function vectorSearch(
  query: string,
  userId: string,
): Promise<RetrievedDocument[]> {
  const text = query.trim();
  if (!text) {
    throw new AppError("Escribe un mensaje para buscar documentos", "EMPTY_QUERY", 400);
  }
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError("El identificador de usuario no es válido", "INVALID_USER_ID", 400);
  }

  const index = process.env.DOCUMENTS_VECTOR_INDEX?.trim();
  const path = process.env.DOCUMENTS_VECTOR_PATH?.trim() || "content";
  if (!index) {
    throw new AppError(
      "Falta DOCUMENTS_VECTOR_INDEX: usa el nombre del índice autoEmbed de documents",
      "VECTOR_SEARCH_NOT_CONFIGURED",
    );
  }

  // Reutiliza la conexión abierta por mongoDB() en server.ts.
  // El índice debe incluir id_user con type: "filter".
  return DocumentModel.collection.aggregate<RetrievedDocument>([
    {
      $vectorSearch: {
        index,
        path,
        query: text,
        numCandidates: 100,
        limit: 5,
        filter: { id_user: new Types.ObjectId(userId) },
      },
    },
    {
      $project: {
        _id: 0,
        title: 1,
        content: 1,
        category: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]).toArray();
}
