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

        // Search for relevant undergraduate materials
        let { data: materials } = await supabase.rpc('search_undergraduate_materials_fts', { search_query: queryText });
        
        if (materials && materials.length > 0) {
          const materialParts: any[] = [];
          materialParts.push({ text: "=== UNDERGRADUATE ACADEMIC MATERIALS (ONLY USE THESE TO ANSWER) ===" });
          for (const mat of materials) {
             materialParts.push({ text: `Source:\nLevel: ${mat.level || '100 Level'}\nCourse Code: ${mat.course_code || 'N/A'}\nCourse Title: ${mat.course_title || 'Unknown'}\nTopic: ${mat.topic_name || 'Unknown'}\nMaterial Title: ${mat.title || 'Unknown'}\nType: ${mat.material_type || 'text'}\nContent:\n${mat.content || ''}\n---\n` });
          }
          materialParts.push({ text: "=== END ACADEMIC MATERIALS ===" });
          materialParts.push({ text: "CRITICAL ANTI-FABRICATION RULE: You MUST strictly distinguish between information found in the retrieved undergraduate academy materials above and information that is absent. If the question can be answered using the retrieved materials, you may explain, summarize, or reorganize the information clearly, and you MUST append a clean citation block at the end in the exact breadcrumb format:\n\n**Source:**\n[Level] → [Course Code] - [Course Title] → [Topic] → [Material Title]\n\nIf the answer CANNOT be fully supported by the retrieved academy materials (or if no materials match), you MUST reply EXACTLY with: 'I couldn't find this topic in your academy materials.' \n\nDo NOT invent answers, do NOT pretend the academy contains information it does not, do NOT invent citations, do NOT cite unrelated materials, and do NOT silently use general model knowledge.\n\n" });

          if (contents.length > 0) {
            for (let i = contents.length - 1; i >= 0; i--) {
              if (contents[i].role === 'user') {
                contents[i].parts = [
                  ...materialParts,
                  ...contents[i].parts
                ];
                break;
              }
            }
          }
        } else {
          // No published materials match
          if (contents.length > 0) {
            for (let i = contents.length - 1; i >= 0; i--) {
              if (contents[i].role === 'user') {
                contents[i].parts = [
                  { text: "CRITICAL RAG RULE: No published undergraduate materials matched this query. You MUST reply exactly with: 'I couldn't find this topic in your academy materials.' Do not fabricate an answer or use external knowledge.\n\n" },
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

    
  // CBT Routes
  app.post('/api/cbt/start', async (req, res) => {
    try {
      const { courseCode, topics, limit } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_PUBLISHABLE_KEY as string, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: userResponse, error: userErr } = await sb.auth.getUser();
      if (userErr || !userResponse?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Fetch exams for the course
      let examsQuery = sb.from('cbt_exams').select('id').eq('course_code', courseCode).eq('is_published', true);
      if (topics && topics.length > 0) {
        examsQuery = examsQuery.in('topic', topics);
      }
      const { data: exams, error: examsErr } = await examsQuery;
      if (examsErr) throw examsErr;

      if (!exams || exams.length === 0) {
        return res.json({ attemptId: null, questions: [] });
      }

      const examIds = exams.map(e => e.id);

      // Fetch questions for those exams
      const { data: questions, error: qErr } = await sb.from('cbt_questions')
        .select('id, exam_id, question_text, option_a, option_b, option_c, option_d, marks, topic, difficulty') // omit correct_option and explanation
        .in('exam_id', examIds);
      
      if (qErr) throw qErr;

      // Shuffle and limit
      let finalQuestions = questions || [];
      finalQuestions = finalQuestions.sort(() => 0.5 - Math.random());
      if (limit) {
        finalQuestions = finalQuestions.slice(0, limit);
      }

      // Create a drill session in DB
      const { data: attempt, error: attemptErr } = await sb.from('cbt_attempts').insert({
         exam_id: examIds[0],
         user_id: userResponse.user.id,
         status: 'in_progress',
         answers: { question_ids: finalQuestions.map(q => q.id) }
      }).select().single();

      if (attemptErr) throw attemptErr;

      res.json({ attemptId: attempt.id, questions: finalQuestions });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cbt/submit', async (req, res) => {
    try {
      const { attemptId, answers } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

      const { createClient } = await import('@supabase/supabase-js');
      const sbClient = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_PUBLISHABLE_KEY as string, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: attempt, error: attemptErr } = await sbClient.from('cbt_attempts').select('*').eq('id', attemptId).single();
      if (attemptErr) throw attemptErr;

      if (!attempt.answers || !attempt.answers.question_ids) {
         return res.status(400).json({ error: 'Invalid attempt' });
      }

      const qIds = attempt.answers.question_ids;

      const { data: questions, error: qErr } = await sbClient.from('cbt_questions')
        .select('*')
        .in('id', qIds);
      if (qErr) throw qErr;

      let totalCorrect = 0;
      let score = 0;
      let totalQuestions = questions.length;
      let results = [];

      for (const q of questions) {
        const studentAns = answers[q.id];
        const isCorrect = studentAns === q.correct_option;
        if (isCorrect) totalCorrect++;
        results.push({
           id: q.id,
           question_text: q.question_text,
           option_a: q.option_a,
           option_b: q.option_b,
           option_c: q.option_c,
           option_d: q.option_d,
           student_answer: studentAns,
           correct_option: q.correct_option,
           explanation: q.explanation,
           is_correct: isCorrect
        });
      }

      score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      // Update attempt
      const { error: updErr } = await sbClient.from('cbt_attempts').update({
         status: 'completed',
         score,
         total_correct: totalCorrect,
         total_wrong: totalQuestions - totalCorrect,
         answers: { ...attempt.answers, student_answers: answers },
         end_time: new Date().toISOString()
      }).eq('id', attemptId);

      if (updErr) throw updErr;

      res.json({
         score,
         totalCorrect,
         totalQuestions,
         results
      });

    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  
  app.get('/api/cbt/exam/:id', async (req, res) => {
    try {
      const examId = req.params.id;
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: examData } = await sb.from('cbt_exams').select('duration_minutes').eq('id', examId).single();
      const duration = examData?.duration_minutes ? examData.duration_minutes * 60 : 1800;

      const { data: questions, error: qErr } = await sb.from('cbt_questions')
        .select('id, exam_id, question_text, option_a, option_b, option_c, option_d, marks, topic, difficulty')
        .eq('exam_id', examId);
      
      if (qErr) throw qErr;

      res.json({ questions: questions || [], duration });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  
  // UTME CBT Backend Routes
  app.post('/api/utme/start', async (req, res) => {
    try {
      const { subjectId, mode, topicId, count } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
        global: { headers: { Authorization: authHeader } }
      });

      let query = sb.from('utme_questions')
        .select('id, question_text, option_a, option_b, option_c, option_d, difficulty, year')
        .eq('subject_id', subjectId)
        .eq('status', 'published');

      if (mode === 'topic' && topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data: questions, error } = await query;
      if (error) throw error;

      let shuffled = [...(questions || [])].sort(() => 0.5 - Math.random());
      if (count && count > 0) {
        shuffled = shuffled.slice(0, count);
      }

      // Create attempt record
      const { data: userData } = await sb.auth.getUser();
      const userId = userData?.user?.id;

      const { data: attempt, error: attemptErr } = await sb.from('utme_attempts').insert([{
        student_id: userId,
        subject_id: subjectId,
        mode,
        status: 'in_progress',
        answers: { question_ids: shuffled.map(q => q.id) }
      }]).select().single();

      if (attemptErr) throw attemptErr;

      res.json({ attemptId: attempt.id, questions: shuffled });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/utme/submit', async (req, res) => {
    try {
      const { attemptId, subjectId, mode, answers, timeUsed } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: attempt, error: attemptErr } = await sb.from('utme_attempts').select('*').eq('id', attemptId).single();
      if (attemptErr) throw attemptErr;

      const qIds = attempt.answers?.question_ids || [];
      const { data: questions, error: qErr } = await sb.from('utme_questions').select('*').in('id', qIds);
      if (qErr) throw qErr;

      let totalCorrect = 0;
      let totalWrong = 0;
      let totalUnanswered = 0;
      let results = [];

      for (const q of questions) {
        const studentAns = answers[q.id];
        const isCorrect = studentAns === q.correct_option;
        if (!studentAns) {
          totalUnanswered++;
        } else if (isCorrect) {
          totalCorrect++;
        } else {
          totalWrong++;
        }

        results.push({
          id: q.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          student_answer: studentAns || null,
          correct_option: q.correct_option,
          explanation: q.explanation,
          is_correct: isCorrect
        });
      }

      const totalQuestions = questions.length;
      const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      // Update attempt
      await sb.from('utme_attempts').update({
        status: 'completed',
        score,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        total_unanswered: totalUnanswered,
        percentage: score,
        time_used: timeUsed,
        answers: { question_ids: qIds, student_answers: answers }
      }).eq('id', attemptId);

      res.json({
        score,
        totalCorrect,
        totalWrong,
        totalUnanswered,
        totalQuestions,
        timeUsed,
        results
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Flutterwave Payment Verification Route
  app.post('/api/payments/verify', async (req, res) => {
    try {
      const { reference, transactionId, amount, plan } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: userData, error: userErr } = await sb.auth.getUser();
      if (userErr || !userData?.user) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const userId = userData.user.id;

      if (!reference) {
        return res.status(400).json({ error: 'Missing payment reference' });
      }

      // 1. Idempotency check: verify if payment reference was already processed
      const { data: existingPayment } = await sb.from('payments').select('*').eq('reference', reference).maybeSingle();
      if (existingPayment) {
        await sb.from('profiles').update({
          premium_status: 'Active',
          payment_reference: reference,
          payment_date: existingPayment.created_at
        }).eq('id', userId);

        return res.json({ success: true, message: 'Payment already verified and premium active.' });
      }

      // 2. Server-side verification with Flutterwave API if secret key exists
      const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY;
      let isSuccessful = true;

      if (flwSecret && transactionId) {
        try {
          const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
            headers: { Authorization: `Bearer ${flwSecret}` }
          });
          const flwData = await flwRes.json();
          if (flwData.status !== 'success' || flwData.data.status !== 'successful') {
            isSuccessful = false;
          }
        } catch (err) {
          console.error('Flutterwave API verification error:', err);
          isSuccessful = false;
        }
      }

      if (!isSuccessful) {
        return res.status(400).json({ error: 'Payment verification failed or transaction was not successful.' });
      }

      // 3. Record payment in payments table (idempotent)
      const { error: payErr } = await sb.from('payments').insert([{
        user_id: userId,
        reference: reference.trim(),
        transaction_id: transactionId ? String(transactionId) : null,
        amount: amount || 5000.00,
        currency: 'NGN',
        status: 'successful',
        provider: 'flutterwave',
        plan: plan || 'premium'
      }]);

      if (payErr && !payErr.message.includes('duplicate key')) {
        throw payErr;
      }

      // 4. Update user profile to Active
      const { error: profileErr } = await sb.from('profiles').update({
        premium_status: 'Active',
        payment_reference: reference.trim(),
        payment_date: new Date().toISOString()
      }).eq('id', userId);

      if (profileErr) throw profileErr;

      // 5. Check if user was referred by a partner and generate 20% commission (idempotent via unique constraint)
      const { data: userProfile } = await sb.from('profiles').select('referred_by_partner_id').eq('id', userId).maybeSingle();
      if (userProfile && userProfile.referred_by_partner_id) {
        const partnerId = userProfile.referred_by_partner_id;
        const { data: partnerData } = await sb.from('partners').select('referral_code, commission_percentage').eq('id', partnerId).maybeSingle();
        
        if (partnerData) {
          const verifiedAmount = amount || 5000.00;
          const rate = partnerData.commission_percentage ? Number(partnerData.commission_percentage) / 100 : 0.20;
          const commissionAmount = Number((verifiedAmount * rate).toFixed(2));

          const { error: commErr } = await sb.from('partner_commission_ledger').insert([{
            partner_id: partnerId,
            referred_user_id: userId,
            referral_code: partnerData.referral_code,
            payment_reference: reference.trim(),
            payment_amount: verifiedAmount,
            commission_rate: rate,
            commission_amount: commissionAmount,
            currency: 'NGN',
            status: 'approved'
          }]);

          if (commErr && !commErr.message.includes('duplicate key')) {
            console.error('Error recording commission ledger:', commErr);
          }
        }
      }

      res.json({ success: true, message: 'Payment verified and Premium successfully activated!' });
    } catch (err: any) {
      console.error('Payment verification error:', err);
      res.status(500).json({ error: err.message || 'Internal payment verification error.' });
    }
  });

  // Flutterwave Webhook Route
  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const event = req.body;
      const signature = req.headers['verif-hash'];
      const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
      if (secretHash && signature && signature !== secretHash) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      if (event && (event.event === 'charge.completed' || event['event.type'] === 'TRANSACTION_SUCCESS')) {
        const data = event.data;
        if (data && data.status === 'successful' && data.tx_ref) {
          const customerEmail = data.customer?.email;
          const reference = data.tx_ref;
          const transactionId = data.id;
          const amount = data.amount;

          if (customerEmail) {
            const { createClient } = await import('@supabase/supabase-js');
            const sbAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

            const { data: profile } = await sbAdmin.from('profiles').select('id').eq('email', customerEmail).maybeSingle();
            if (profile) {
              const { data: existing } = await sbAdmin.from('payments').select('id').eq('reference', reference).maybeSingle();
              if (!existing) {
                await sbAdmin.from('payments').insert([{
                  user_id: profile.id,
                  reference,
                  transaction_id: transactionId ? String(transactionId) : null,
                  amount: amount || 0,
                  status: 'successful',
                  provider: 'flutterwave'
                }]);

                await sbAdmin.from('profiles').update({
                  premium_status: 'Active',
                  payment_reference: reference,
                  payment_date: new Date().toISOString()
                }).eq('id', profile.id);

                // Check and create commission if referred
                const { data: userProfile } = await sbAdmin.from('profiles').select('referred_by_partner_id').eq('id', profile.id).maybeSingle();
                if (userProfile && userProfile.referred_by_partner_id) {
                  const partnerId = userProfile.referred_by_partner_id;
                  const { data: partnerData } = await sbAdmin.from('partners').select('referral_code, commission_percentage').eq('id', partnerId).maybeSingle();

                  if (partnerData) {
                    const verifiedAmount = amount || 5000.00;
                    const rate = partnerData.commission_percentage ? Number(partnerData.commission_percentage) / 100 : 0.20;
                    const commissionAmount = Number((verifiedAmount * rate).toFixed(2));

                    await sbAdmin.from('partner_commission_ledger').insert([{
                      partner_id: partnerId,
                      referred_user_id: profile.id,
                      referral_code: partnerData.referral_code,
                      payment_reference: reference.trim(),
                      payment_amount: verifiedAmount,
                      commission_rate: rate,
                      commission_amount: commissionAmount,
                      currency: 'NGN',
                      status: 'approved'
                    }]);
                  }
                }
              }
            }
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (err: any) {
      console.error('Webhook error:', err);
      res.status(500).json({ error: err.message });
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
