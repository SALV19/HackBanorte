import { Request, Response } from "express";
import { UserDataAccess } from "../model/user.model";
import getUserFinance from "../usecase/getUserFinance.usecase";

/** Perfiles de demostración: no sustituye autenticación. */
export async function getUsers(_req: Request, res: Response) {
  const users = await UserDataAccess.getRegisteredUsers();
  res.json({ users });
}

export async function getUserProfile(req: Request, res: Response) {
  const userName = Array.isArray(req.params.name)
    ? req.params.name[0]
    : req.params.name;
  const user = await UserDataAccess.getUserByName(userName);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  const finance = await getUserFinance(String(user._id));
  res.json({
    user: {
      id: String(user._id),
      name: user.name,
      age: user.age,
      job: user.job,
    },
    finance,
  });
}
