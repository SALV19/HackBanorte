import { InferSchemaType, Types } from "mongoose";
import { model, Schema } from "mongoose";

const UISchema = new Schema(
  {
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export type UI = InferSchemaType<typeof UISchema>;

// MODEL
const UIModel = model<UI>("UI", UISchema);

export type CreateUIDTO = Omit<UI, "_id" | "createdAt" | "updatedAt">;

export const UIDataAccess = {
  getUI: async (_id: Types.ObjectId) => {
    return await UIModel.find({ _id: _id }).exec();
  },

  createUI: async (ui: CreateUIDTO) => {
    return await UIModel.create({
      ...ui,
    });
  },
};
