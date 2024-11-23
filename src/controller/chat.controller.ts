import { Request, Response } from "express";
import {
  cargarChat,
  groqChat,
  uploadVectorToPinecone,
  vectorizePDF,
} from "../services/chat.service";

export async function getChats(req: Request, res: Response) {
  try {
    const docs = await cargarChat();
    console.log(docs);
    res.send(docs);
    // res.json({ message: "Hola desde el controlador" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getVectores(req: Request, res: Response) {
  try {
    const vectores = await vectorizePDF();
    res.send(vectores);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getInfoPinecone(req: Request, res: Response) {
  try {
    const vectores = await uploadVectorToPinecone();
    res.send(vectores);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function postChat(req: Request, res: Response) {
  try {
    const { input } = req.body;
    const response = await groqChat(input);
    res.status(200).json({
      response,
      source: "./src/data/imperioromano.pdf",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
