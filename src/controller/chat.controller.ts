import { Request, Response } from "express";
import {
  cargarChat,
  groqChat,
  searchQuery,
  uploadVectorToPinecone,
  vectorizePDF,
} from "../services/chat.service";
import { Document } from "@langchain/core/documents";

export async function getChats(req: Request, res: Response) {
  try {
    const docs: Document<Record<string, string>>[] = await cargarChat();
    res.status(200).json(docs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getVectores(req: Request, res: Response) {
  try {
    const vectores: Document<Record<string, string>>[] = await vectorizePDF();
    res.status(200).json(vectores);
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

    const { response, source }: { response: any; source: string } =
      await groqChat(input);

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

    const { response, source }: { response: string[]; source: string } =
      await searchQuery(query);

    res.status(200).json({
      response,
      source,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
