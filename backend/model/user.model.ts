import { Types } from "mongoose";
import { model, Schema } from "mongoose";

export interface User {
  id_usuario?: Types.ObjectId;
  name: string;
  age: number;
  job: string;
  account: Types.ObjectId;
}

const UserSchema = new Schema<User>({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  job: { type: String, required: true },
  account: { type: Types.ObjectId, required: true },
});

// MODEL
const UserModel = model<User>("User", UserSchema);

export const UserDataAccess = {
  getUserByName: async (name: string) => {
    try {
      const user = await UserModel.findOne({ nombre: name }).exec();
      return user;
    } catch (error) {
      throw new Error(
        `Database failure while fetching user '${name}': ${(error as Error).message}`,
      );
    }
  },
};
