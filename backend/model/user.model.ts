import { Types } from "mongoose";
import { model, Schema } from "mongoose";

export interface User {
  id_usuario?: Types.ObjectId;
  name: string;
  age: number;
  job: string;
}

const UserSchema = new Schema<User>({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  job: { type: String, required: true },
});

// MODEL
export const UserModel = model<User>("User", UserSchema);

export const UserDataAccess = {
  getRegisteredUsers: async () => {
    return UserModel.find({}, { name: 1, age: 1, job: 1 }).sort({ name: 1 }).lean().exec();
  },
  getUserByName: async (name: string) => {
    try {
      const user = await UserModel.findOne({ name }).exec();
      return user;
    } catch (error) {
      throw new Error(
        `Database failure while fetching user '${name}': ${(error as Error).message}`,
      );
    }
  },
};
