import express from "express";
import sendMessage from "../controllers/sendMessage.controller";
import { getUserProfile, getUsers } from "../controllers/getUsers.controller";

const router = express.Router();

router.post("/mcp/chat", sendMessage);
router.get("/users", getUsers);
router.get("/users/:name", getUserProfile);

export default router;
