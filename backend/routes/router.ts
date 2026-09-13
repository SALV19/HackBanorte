import express from "express";
import sendMessage from "../controllers/sendMessage.controller";
import a2uiAction from "../controllers/a2uiAction.controller";

const router = express.Router();

router.post("/mcp/chat", sendMessage);
router.post("/a2ui/action", a2uiAction);

export default router;
