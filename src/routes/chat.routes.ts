import { Router } from "express";
import {
  getChats,
  getInfoPinecone,
  getVectores,
  postChat,
} from "../controller/chat.controller";

const router = Router();

router.get("/chats", getChats);
router.get("/chats/vectores", getVectores);
router.get("/chats/pinecone", getInfoPinecone);
router.post("/chats", postChat);

export default router;
