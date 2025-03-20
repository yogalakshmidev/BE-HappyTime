import express from "express";
import { sendMessage, getMessages } from "../controller/messageController.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const messageRouter = express.Router();

messageRouter.post("/send/:id", isAuthenticated, sendMessage);
messageRouter.get("/all/:id", isAuthenticated, getMessages);

export default messageRouter;
