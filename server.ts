import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import multer from "multer";
import * as fs from "fs";
import 'dotenv/config';
import { jsonrepair } from 'jsonrepair';

let aiClient: GoogleGenAI | null = null;
const getAI = () => {
    if (!aiClient) {
        if (!process.env.GEMINI_API_KEY) {
             throw new Error('GEMINI_API_KEY environment variable is required');
        }
        aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return aiClient;
};

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add COOP header to allow Firebase Google Auth popup to communicate back
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
  });

  // Middleware to parse large JSON requests (for text extracted from docx)
  app.use(express.json({ limit: '50mb' }));

  app.post('/api/autofill', upload.single('file'), async (req, res) => {
      try {
          const documentHtml = req.body.documentHtml;
          const formSchemaString = req.body.formSchema;
          let formSchema;
          try { formSchema = JSON.parse(formSchemaString); } catch (e) {}
          
          const tableSchemasString = req.body.tableSchemas;
          let tableSchemas: any[] = [];
          if (tableSchemasString) {
              try { tableSchemas = JSON.parse(tableSchemasString); } catch (e) {}
          }

          const uploadedFile = (req as any).file;
          
          if ((!documentHtml && !uploadedFile) || !formSchema) {
              return res.status(400).json({ error: 'document content and formSchema are required' });
          }
          
          const ai = getAI();
          
          const autofillSchema: Schema = {
              type: Type.OBJECT,
              properties: {
                  fields: {
                      type: Type.ARRAY,
                      description: "List of filled form fields",
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              id: { type: Type.STRING },
                              value: { type: Type.STRING }
                          }
                      }
                  },
                  ...(tableSchemas.length > 0 ? {
                      tables: {
                          type: Type.ARRAY,
                          description: "Extracted rows for dynamic tables",
                          items: {
                              type: Type.OBJECT,
                              properties: {
                                  tableName: { type: Type.STRING },
                                  rows: {
                                      type: Type.ARRAY,
                                      items: {
                                          type: Type.OBJECT,
                                          properties: {
                                              columns: {
                                                  type: Type.ARRAY,
                                                  items: {
                                                      type: Type.OBJECT,
                                                      properties: {
                                                          columnName: { type: Type.STRING },
                                                          value: { type: Type.STRING }
                                                      }
                                                  }
                                              }
                                          }
                                      }
                                  }
                              }
                          }
                      }
                  } : {})
              }
          };

          const prompt = `You are an expert data extraction and mapping assistant. I will provide you with a source document (either as HTML, or an attached file like a PDF), and a JSON schema of a web form. 
Your task is to extract the filled-in answers from the document and accurately map them to the corresponding form fields in the JSON schema.

Document Analysis Guidelines:
1. Pay special attention to bold text (<b>, <strong>), italics (<i>), underlines (<u>), or hand-entered text, as these often denote the user's answers.
2. For checkboxes and radio buttons in the document (like ☑ or [x]), pay close attention to which option was selected.
3. Compare the extracted answer with the context, options, and placeholders provided in the Form Schema to find the best match.

Form Mapping Guidelines:
1. For text inputs, return the extracted string.
2. For checkboxes and radio buttons (type="checkbox" or type="radio"), if the user's document indicates the option corresponding to the field's 'context' or 'value' is selected, return "true". Otherwise, don't include it. 
   - Note: Radio buttons often share the same 'name'. Only the selected one should be returned as "true".
3. For date inputs (type="date"), strictly format the date as YYYY-MM-DD. If the document has "25/08/1990", return "1990-08-25".
4. For select inputs, return a value that exactly matches one of the provided 'options'.

Form Schema (Target fields):
${JSON.stringify(formSchema, null, 2)}

${tableSchemas.length > 0 ? `Additionally, extract records for the following dynamic tables:
${JSON.stringify(tableSchemas, null, 2)}
For these tables, extract ALL rows found in the document.` : ''}

${documentHtml ? `Document HTML (Source data):\n${documentHtml}` : `(The document is provided as an attached file)`}
          `;

          let response;
          let retries = 5;
          let delay = 10000;
          let currentModel = 'gemini-2.5-flash';
          
          while (retries > 0) {
              try {
                  const parts: any[] = [{ text: prompt }];
                  if (uploadedFile) {
                      parts.push({
                          inlineData: {
                              data: uploadedFile.buffer.toString('base64'),
                              mimeType: uploadedFile.mimetype || "application/pdf"
                          }
                      });
                  }

                  response = await ai.models.generateContent({
                      model: currentModel,
                      contents: [{ role: 'user', parts }],
                      config: {
                           responseMimeType: 'application/json',
                           responseSchema: autofillSchema,
                           temperature: 0.1
                      }
                  });
                  break; // Success, exit retry loop
              } catch (e: any) {
                  console.warn(`API call failed with model ${currentModel}. Retries left: ${retries - 1}. Error:`, e.message);
                  retries -= 1;
                  if (retries === 0) throw e;
                  
                  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
                  currentModel = models[(5 - retries) % models.length];
                  
                  let waitTime = delay;
                  // If the error message mentions a specific retry delay (e.g. "Please retry in 14.6s"), try to parse it
                  const retryMatch = e.message.match(/retry in\s+([\d\.]+)\s*s/i);
                  if (retryMatch && retryMatch[1]) {
                      const suggestedDelay = parseFloat(retryMatch[1]) * 1000;
                      if (!isNaN(suggestedDelay) && suggestedDelay > waitTime) {
                          waitTime = suggestedDelay + 2000; // adding 2s buffer
                      }
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                  delay = waitTime * 1.2; // Exponential backoff
              }
          }
          
          const dataPayload = response.text;
          if (!dataPayload) {
              return res.status(500).json({ error: "Failed to extract data" });
          }

          let parsedData;
          try {
              parsedData = JSON.parse(dataPayload);
          } catch(e) {
              if (dataPayload.length > 50000) {
                  throw new Error("The AI returned a response that was too large and incomplete. Please try again or use a smaller document.");
              }
              try {
                  console.warn("Attempting to repair JSON payload:", e);
                  parsedData = JSON.parse(jsonrepair(dataPayload));
              } catch (e2) {
                  throw new Error(`Failed to parse and repair response: ${e2}`);
              }
          }
          res.json({ data: parsedData });
      } catch (err: any) {
          console.error("Autofill API Error: ", err);
          res.status(500).json({ error: err.message || "Failed to parse document content" });
      }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
