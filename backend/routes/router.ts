import express from "express";
import sendMessage from "../controllers/sendMessage.controller";
import { UserDataAccess } from '../model/user.model';

const router = express.Router();

router.post("/mcp/chat", sendMessage);

router.get('/mcp/profiles', async (_req, res) => {
  try {
    const users = await UserDataAccess.getProfiles();
    res.json({ success: true, profiles: users.map(user => ({ id: String(user._id), name: user.name, age: user.age, job: user.job })) });
  } catch {
    res.status(503).json({ success: false, message: 'No se pudieron cargar los perfiles' });
  }
});

export default router;
