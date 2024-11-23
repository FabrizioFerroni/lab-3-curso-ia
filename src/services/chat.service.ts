import { config } from "dotenv";
config();
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PineconeStore } from "@langchain/pinecone";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import type { Document } from "@langchain/core/documents";
import { v4 as uuidv4 } from "uuid";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const { API_KEY, HUGGINGFACEHUB_API_KEY, API_GROQ } = process.env;

const pdfFile = "./src/data/imperioromano.pdf";
const indexName = "lab-3";

export const cargarChat = async () => {
  const loader = new PDFLoader(pdfFile);

  const docs = await loader.load();

  return docs;
};

export const vectorizePDF = async () => {
  const docs: Document<Record<string, string>>[] = [];
  const data = await cargarChat();

  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    docs.push(element);
  }

  return docs;
};

export const uploadVectorToPinecone = async () => {
  const data: Document<Record<string, string>>[] = await vectorizePDF();
  const documents: Document<Record<string, string>>[] = [];
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: HUGGINGFACEHUB_API_KEY,
  });

  const pinecone = new PineconeClient({
    apiKey: API_KEY!,
  });

  const indexExists = await pinecone.describeIndex(indexName).catch(() => null);

  if (!indexExists) {
    await pinecone.createIndex({
      name: indexName,
      dimension: 768,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });
  }

  const pineconeIndex = pinecone.Index(indexName);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });

  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    const id = uuidv4();
    element.id = id;
    documents.push(element);
  }

  const vectors = await vectorStore.addDocuments(documents, {
    namespace: "lab-3-ns",
  });

  if (vectors === null) {
    return "No se han agregado vectores";
  }

  return "Vectores agregados con éxito";
};

export const groqChat = async (input: string) => {
  const model = new ChatGroq({
    apiKey: API_GROQ,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant"],
    ["human", "{input}"],
  ]);

  const chain = prompt.pipe(model);
  const response = await chain.invoke({
    input,
  });

  return response;
};

const searchQuery = async (query: string) => {};
