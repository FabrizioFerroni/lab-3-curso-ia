import { config } from "dotenv";
config();
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PineconeStore } from "@langchain/pinecone";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import {
  Index,
  IndexModel,
  Pinecone as PineconeClient,
  RecordMetadata,
} from "@pinecone-database/pinecone";
import type { Document } from "@langchain/core/documents";
import { v4 as uuidv4 } from "uuid";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessageChunk } from "@langchain/core/messages";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { SerializedFields } from "@langchain/core/dist/load/map_keys";

const { API_KEY, HUGGINGFACEHUB_API_KEY, API_GROQ } = process.env;

const pdfFile = "./src/data/imperioromano.pdf";
const indexName = "lab-3";

export const initializePineconeClient = async () => {
  const pinecone: PineconeClient = new PineconeClient({
    apiKey: API_KEY!,
  });
  return pinecone;
};

export const ensurePineconeIndex = async (
  pinecone: PineconeClient,
  indexName: string
) => {
  const indexExists: IndexModel | null = await pinecone
    .describeIndex(indexName)
    .catch(() => null);

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
  return pinecone.Index(indexName);
};

export const cargarChat = async () => {
  const loader: PDFLoader = new PDFLoader(pdfFile);

  const docs: Document<Record<string, string>>[] = await loader.load();

  return docs;
};

export const vectorizePDF = async () => {
  const docs: Document<Record<string, string>>[] = [];
  const data: Document<Record<string, string>>[] = await cargarChat();

  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    docs.push(element);
  }

  return docs;
};

export const initializeVectorStore = async (
  pineconeIndex: Index<RecordMetadata>
) => {
  const embeddings: HuggingFaceInferenceEmbeddings =
    new HuggingFaceInferenceEmbeddings({
      apiKey: HUGGINGFACEHUB_API_KEY,
    });

  const vectorStore: PineconeStore = await PineconeStore.fromExistingIndex(
    embeddings,
    {
      pineconeIndex,
      maxConcurrency: 5,
      namespace: "lab-3-ns",
    }
  );

  return vectorStore;
};

export const addDocumentsToVectorStore = async (
  vectorStore: PineconeStore,
  data: Document<Record<string, string>>[]
) => {
  const documents: Document<Record<string, string>>[] = [];

  for (const element of data) {
    const id = uuidv4();
    element.id = id;
    documents.push(element);
  }

  const vectors: string[] = await vectorStore.addDocuments(documents, {
    namespace: "lab-3-ns",
  });

  return vectors;
};

export const uploadVectorToPinecone = async () => {
  const data: Document<Record<string, string>>[] = await vectorizePDF();

  const pinecone: PineconeClient = await initializePineconeClient();
  const pineconeIndex: Index<RecordMetadata> = await ensurePineconeIndex(
    pinecone,
    indexName
  );
  const vectorStore: PineconeStore = await initializeVectorStore(pineconeIndex);
  const vectors: string[] = await addDocumentsToVectorStore(vectorStore, data);

  if (vectors === null) {
    return {
      message: "No se han agregado vectores",
      data: null,
    };
  }

  return {
    message: "Vectores agregados con éxito",
    data: vectors,
  };
};

export const groqChat = async (input: string) => {
  const promptTemplate: string = `
  Eres un experto profesor del imperio romano , tu trabajo es responder mi pregunta en base al contexto que te envio.
  Sigue los siguientes pasos:
  1 ) Analiza detalladamente la pregunta he intentan encontrar la respuesta.
  2 ) Redacta una respuesta formal y concisa.
  3 ) En caso de que la pregunta no se encuentre en el contexto responde con la siguiente frase (No tengo contexto para responder tu pregunta)
  Aqui envio el contexto :
  {context}
  `;

  const llm: ChatGroq = new ChatGroq({
    model: "mixtral-8x7b-32768",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: API_GROQ,
  });

  const { response: context, source }: { response: string[]; source: string } =
    await searchQuery(input);

  const prompt: ChatPromptTemplate = ChatPromptTemplate.fromMessages([
    { role: "system", content: promptTemplate },
    { role: "human", content: "{question}" },
  ]);

  const chain: Runnable<
    any,
    AIMessageChunk,
    RunnableConfig<Record<string, any>>
  > = prompt.pipe(llm);

  const response: AIMessageChunk = await chain.invoke({
    context,
    question: input,
  });

  const { content } = response.lc_kwargs;

  return { response: content, source: source };
};

export const searchQuery = async (query: string) => {
  const pinecone: PineconeClient = await initializePineconeClient();
  const pineconeIndex: Index<RecordMetadata> = await ensurePineconeIndex(
    pinecone,
    indexName
  );
  const vectorStore: PineconeStore = await initializeVectorStore(pineconeIndex);

  const results: Document<Record<string, string>>[] =
    await vectorStore.similaritySearch(query, 4);
  const response: string[] = results.map(
    (res) => `* ${res.pageContent} [${JSON.stringify(res.metadata)}]`
  );
  return {
    response: response,
    source: results[0].metadata.source,
  };
};
