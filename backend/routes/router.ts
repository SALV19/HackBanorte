import express from "express";
import sendMessage from "../controllers/sendMessage.controller";

const router = express.Router();

router.post("/mcp/chat", sendMessage);

export default router;
