import { Types } from "mongoose";
import { model, Schema } from "mongoose";

export interface User {
  id_usuario?: Types.ObjectId;
  nombre: string;
  edad: number;
  trabajo: string;
  cuenta_bancaria: Types.ObjectId;
}

const UserSchema = new Schema<User>({
  nombre: { type: String, required: true },
  edad: { type: Number, required: true },
  trabajo: { type: String, required: true },
  cuenta_bancaria: { type: Types.ObjectId, required: true },
});

// MODEL
const UserModel = model<User>("User", UserSchema);

export const UserDataAccess = {
  getUserByName: async (name: string) => {
    const user = await UserModel.findOne({ nombre: name });
    return user;
  },
};
