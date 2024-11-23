import { config } from "dotenv";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import chatRoute from "./routes/chat.routes";
import cors from "cors";
import morgan from "morgan";

config();

const app = express();
const port = process.env.API_PORT;
const entorno = process.env.NODE_ENV || "dev";

const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));

app.use(morgan(entorno));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", chatRoute);

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Bienvenido a la api de chatbot. Hecha por Fabrizio Ferroni.",
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
