import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

import 'dotenv/config';

// Load Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);


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
        model: 'gemini-3.6-flash',
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

  
    
    app.post('/api/index-lesson', async (req, res) => {
      try {
        const { lessonId, title, rawText } = req.body;
        
        if (!lessonId || !rawText) {
          return res.status(400).json({ error: 'Missing lessonId or rawText' });
        }

        console.log(`[AI Indexing Pipeline] Processing lesson ${lessonId}`);
        
        // 1. Clean HTML
        const noHtml = rawText.replace(/<[^>]*>?/gm, '');
        // 2. Remove duplicate spaces
        const cleanedText = noHtml.replace(/\s+/g, ' ').trim();
        
        // 3. Extract keywords & Summary with Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
        
        const ai = new GoogleGenAI({ apiKey });
        
        const schema = {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A short 2-sentence summary of the lesson." },
            keywords: { type: Type.STRING, description: "A string of 5-7 comma-separated keywords extracted from the text." }
          },
          required: ["summary", "keywords"]
        };
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Analyze this lesson content.\nTitle: "${title || 'Untitled'}"\nContent: "${cleanedText.substring(0, 5000)}"\nExtract keywords and generate a short AI summary.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema as Schema,
            temperature: 0.2
          }
        });
        
        const result = response.text ? JSON.parse(response.text) : { summary: '', keywords: '' };
        
        // 4. Update the search index automatically
        // Prepend the summary to the cleaned text for context
        const finalContent = `[AI Summary: ${result.summary}]\n\n${cleanedText}`;
        
        const { error } = await supabase.from('lesson_ai_index')
          .update({ 
            content: finalContent, 
            keywords: result.keywords 
          })
          .eq('lesson_id', lessonId);
          
        if (error) throw error;
        
        console.log(`[AI Indexing Pipeline] Cleaned text, extracted keywords, and updated search index for ${lessonId}.`);
        
        res.json({ success: true, message: 'Lesson automatically indexed for AI.', data: result });
      } catch (err: any) {
        console.error('[AI Indexing Error]', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/chat', async (req, res) => {
    try {
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
      }
      
      let systemPrompt = "You are TONBORZY AI Tutor, a helpful academic assistant for an educational platform. You help students with their studies, explain concepts step by step, and solve problems with worked solutions. Explain science, engineering, computing concepts, and university-level topics. Help students prepare for CBT examinations, generate quizzes when requested, summarize academic notes, simplify difficult concepts, and recommend study strategies. If course materials are provided, use them as the highest-priority knowledge source. Otherwise, use your general educational knowledge. Never return fake information. If the answer is uncertain, state that clearly instead of inventing facts. Encourage learning instead of cheating, explain answers instead of only giving results, use clear language, and maintain a professional tone. Never expose that you are Gemini, identify yourself only as TONBORZY AI Tutor. If you need more information, use Google Search.";
      let personality = "Professional and encouraging";
      let teachingStyle = "Step-by-step guidance";
      let answerLength = "Detailed";
      let language = "English";

      let { messages, userRole, userId } = req.body;

      // Implement temporary conversation memory - retain only last 10 messages
      if (messages && messages.length > 10) {
        messages = messages.slice(-10);
      }

      try {
        const { data: settings } = await supabase.from('ai_settings').select('*').limit(1).maybeSingle();
        if (settings) {
          if (settings.enabled === false) {
             return res.status(403).json({ error: 'AI is currently disabled by the administrator.' });
          }
          if (settings.system_prompt) systemPrompt = settings.system_prompt;
          if (settings.personality) personality = settings.personality;
          if (settings.teaching_style) teachingStyle = settings.teaching_style;
          if (settings.answer_length) answerLength = settings.answer_length;
          if (settings.language) language = settings.language;
          
          if (settings.block_offensive) {
            systemPrompt += "\nCRITICAL SAFETY RULE: You must politely refuse to answer any prompt containing offensive language, profanity, or inappropriate content.";
          }
          if (settings.academic_only) {
            systemPrompt += "\nCRITICAL ACADEMIC RULE: You must only answer academic and educational questions. Politely refuse to answer anything non-academic.";
          }

          const startOfDay = new Date();
          startOfDay.setHours(0,0,0,0);
          
          if (settings.daily_limit > 0) {
             const { count: dailyCount } = await supabase.from('ai_conversations')
               .select('*', { count: 'exact', head: true })
               .gte('created_at', startOfDay.toISOString());
             if (dailyCount !== null && dailyCount >= settings.daily_limit) {
               throw new Error('Global daily AI request limit reached. Please try again tomorrow.');
             }
          }

          if (settings.student_limit > 0 && userId) {
             const { count: studentCount } = await supabase.from('ai_conversations')
               .select('*', { count: 'exact', head: true })
               .eq('user_id', userId)
               .gte('created_at', startOfDay.toISOString());
             if (studentCount !== null && studentCount >= settings.student_limit) {
               throw new Error('You have reached your personal daily AI request limit. Please try again tomorrow.');
             }
          }
        }
      } catch (err: any) {
        console.error("AI Settings/Quota Error:", err);
        return res.status(403).json({ error: err.message || 'Failed to authorize AI request.' });
      }

      const combinedSystemInstruction = `${systemPrompt}
      
Instructions:
- Personality: ${personality}
- Teaching Style: ${teachingStyle}
- Answer Length: ${answerLength}
- Language: ${language}`;

      const ai = new GoogleGenAI({ apiKey });
      
      const contents = messages.map((msg: any) => {
        const parts: any[] = [];
        if (msg.fileData) {
          parts.push({
            inlineData: {
              mimeType: msg.fileData.mimeType,
              data: msg.fileData.data
            }
          });
        }
        parts.push({ text: msg.content });
        return {
          role: msg.role === 'ai' ? 'model' : 'user',
          parts
        };
      });


      // Inject Academic Management Lessons
      try {
        // Use up to the last 2 user messages to build context-aware search queries for follow-ups
        const recentUserMessages = contents.filter((c: any) => c.role === 'user').slice(-2);
        const queryText = recentUserMessages.map((m: any) => m.parts.map((p: any) => p.text).join(' ')).join(' ');

        // Search for relevant lessons
        let { data: lessons } = await supabase.rpc('search_lessons_fts', { search_query: queryText });
        
        if (lessons && lessons.length > 0) {
          const lessonParts: any[] = [];
          lessonParts.push({ text: "=== ACADEMIC MANAGEMENT LESSONS (ONLY USE THESE TO ANSWER) ===" });
          for (const lesson of lessons) {
             lessonParts.push({ text: `Source:\nFaculty/Subject: ${lesson.subject || 'Unknown'}\nCourse: ${lesson.course || 'Unknown'}\nTopic: ${lesson.topic || 'Unknown'}\nLesson Title: ${lesson.title || 'Unknown'}\nContent:\n${lesson.content || ''}\n---\n` });
          }
          lessonParts.push({ text: "=== END ACADEMIC LESSONS ===" });
          lessonParts.push({ text: "CRITICAL RAG RULE: You MUST answer the following query ONLY using the information provided in the Academic Management Lessons above. If the lessons do not contain the answer, you MUST reply exactly with: 'I couldn't find this topic in your academy materials.' Do not fabricate answers. When answering from the materials, you MUST include a citation at the end of your response in the format: 'This answer came from: [Faculty/Subject] -> [Course] -> [Topic] -> [Lesson Title]'.\n\n" });

          if (contents.length > 0) {
            for (let i = contents.length - 1; i >= 0; i--) {
              if (contents[i].role === 'user') {
                contents[i].parts = [
                  ...lessonParts,
                  ...contents[i].parts
                ];
                break;
              }
            }
          }
        } else {
          // No lessons match
          if (contents.length > 0) {
            for (let i = contents.length - 1; i >= 0; i--) {
              if (contents[i].role === 'user') {
                contents[i].parts = [
                  { text: "CRITICAL RAG RULE: No additional academy lessons matched this specific query. You MUST answer this query based ONLY on the context established in the previous messages of this conversation. If the answer cannot be found in the previous discussion or lessons, you MUST reply exactly with: 'I couldn't find this topic in your academy materials.' Do not fabricate answers.\n\n" },
                  ...contents[i].parts
                ];
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load Academic Lessons:", err);
      }

      const responseStream = await ai.models.generateContentStream({

        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction: combinedSystemInstruction,
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
