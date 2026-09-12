import { Schema, model, InferSchemaType } from "mongoose";

const DocumentSchema = new Schema(
  {
    id_user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
  },
  { timestamps: true },
);

export type DocumentType = InferSchemaType<typeof DocumentSchema>;

export const DocumentModel = model<DocumentType>("Document", DocumentSchema);

export type CreateDocumentDTO = Omit<DocumentType, "_id" | "updatedAt"> & {
  createdAt?: Date;
};

export const DocumentDataAccess = {
  getDocumentsByUser: async (userId: string) => {
    return await DocumentModel.find({ id_user: userId }).exec();
  },

  createDocument: async (documentData: CreateDocumentDTO) => {
    return await DocumentModel.create({
      ...documentData,
      createdAt: documentData.createdAt ?? new Date(),
    });
  },
};
