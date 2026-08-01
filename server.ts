import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post('/api/categorize-files', async (req, res) => {
    try {
      const { files, portal } = req.body; // files: { id, name, url }[]
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Categorize the following files for an educational platform (Portal: ${portal}).
      
For each file, determine:
- subject (e.g., Mathematics, Physics, English, Chemistry)
- file_type (must be one of: 'video', 'pdf', 'past_question', 'assignment', 'image', 'doc', 'ppt', 'zip', 'link')
- topic (if discernible from the name, else 'General')
- is_past_question (boolean)

If you cannot determine a subject, use 'Uncategorized'.
Files:
${files.map((f: any) => `- ${f.name}`).join('\n')}
`;

      const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            subject: { type: Type.STRING },
            course_code: { type: Type.STRING },
            semester: { type: Type.STRING },
            portal: { type: Type.STRING },
            file_type: { type: Type.STRING },
            topic: { type: Type.STRING },
            is_past_question: { type: Type.BOOLEAN },
          },
          required: ["name", "subject", "file_type", "topic", "is_past_question"]
        }
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1
        }
      });

      const result = JSON.parse(response.text || '[]');
      res.json(result);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  
    app.post('/api/chat', async (req, res) => {
    try {
      const { messages, userRole } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = "You are TUNBORZY AI, a helpful academic assistant for an educational platform. You help students with their studies, explain concepts, and solve problems. If you need more information, use Google Search.";
      
      const contents = messages.map((msg) => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        }
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      console.error('Chat error:', err);
      // If headers are not sent, send error
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
    }
  });

    // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
