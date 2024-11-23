import { Router } from "express";
import {
  getChats,
  getInfoPinecone,
  getVectores,
  postChat,
  searchQueryC,
} from "../controller/chat.controller";

const router = Router();

router.get("/chats/cargar", getChats);
router.get("/chats/vectores", getVectores);
router.get("/chats/pinecone", getInfoPinecone);
router.post("/chats", postChat);
router.post("/chats/search", searchQueryC);

export default router;
