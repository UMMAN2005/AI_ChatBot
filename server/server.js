import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Set up storage for multer to keep files in memory
const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (req, res) => {
  res.status(200).send({ message: "Hello from CodeX!" });
});

app.post("/", upload.single("image"), async (req, res) => {
  try {
    const { prompt, image, extension } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let parts = [prompt];

    if (image) {
      const mimeType = `image/${extension}`;
      const imageData = image.toString("base64");

      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      const guid = uuidv4();

      const buffer = Buffer.from(base64Data, "base64");
      const filePath = `../uploads/${guid}.${extension}`;

      fs.writeFileSync(filePath, buffer);

      const imageFile = fs.readFileSync(filePath);
      const imageBase64 = imageFile.toString("base64");
      const data = imageBase64;

      parts.push({
        inlineData: {
          data,
          mimeType,
        },
      });
    }

    const result = await model.generateContent([...parts]);
    const response = result.response;
    const text = response.text();

    res.status(200).send({ bot: text });
  } catch (error) {
    res.status(500).send({ error: error.message || "Something went wrong" });
  }
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`AI server started on http://localhost:${PORT}`)
);
