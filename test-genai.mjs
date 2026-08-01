import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "INVALID_KEY_12345" });
ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: "test",
}).then(res => console.log("SUCCESS")).catch(err => console.error("ERROR:", err.message));
