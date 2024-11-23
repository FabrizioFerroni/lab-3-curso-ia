import { Request, Response } from "express";
import {
  cargarChat,
  groqChat,
  searchQuery,
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
    const { message, data }: { message: string; data: string[] | null } =
      await uploadVectorToPinecone();

    res.status(200).json({
      message: message,
      data: data,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function postChat(req: Request, res: Response) {
  try {
    const { input } = req.body;
    const { response, source } = await groqChat(input);
    res.status(200).json({
      response,
      source,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function searchQueryC(req: Request, res: Response) {
  try {
    const { query } = req.body;
    const response = await searchQuery(query);
    res.status(200).json({
      response,
      source: "./src/data/imperioromano.pdf",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
