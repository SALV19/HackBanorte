import { model, Schema } from 'mongoose';

export const UserModel = model('User', new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  job: { type: String, required: true },
}));
export const UserDataAccess = {
  getUserByName: (name: string) => UserModel.findOne({ name }).exec(),
  getProfiles: () => UserModel.find({}, { name: 1, age: 1, job: 1 }).sort({ name: 1 }).lean().exec(),
};
