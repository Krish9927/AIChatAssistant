import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Conversation from '../models/Conversation.js';

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Tone → System Instruction Map ────────────────────────
const TONE_PROMPTS = {
  professional:
    'You are a professional AI assistant. Respond in a formal, precise, and structured manner. Use clear language suitable for a business or academic context.',
  casual:
    'You are a friendly AI assistant. Respond in a relaxed, conversational, and approachable tone. Feel free to use everyday language and be warm.',
  concise:
    'You are a concise AI assistant. Respond in as few words as possible while still being accurate and helpful. Avoid any unnecessary explanation.',
};

// ── Build Gemini chat history from stored messages ────────
// Gemini expects: [{ role: 'user'|'model', parts: [{ text }] }]
// The system prompt is passed separately as systemInstruction.
function buildGeminiHistory(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

// ── POST /api/chat/stream ─────────────────────────────────
router.post('/stream', async (req, res) => {
  const { conversationId, message, tone = 'professional' } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // Load or create the conversation document
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }
    if (!conversation) {
      conversation = new Conversation({ tone });
    }

    conversation.tone = tone;
    conversation.messages.push({ role: 'user', content: message });

    // Build history excluding the latest user message (sent separately)
    const history = buildGeminiHistory(
      conversation.messages.slice(0, -1)
    );

    const systemPrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.professional;

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history });

    // ── SSE Headers ───────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // ── Gemini Streaming ──────────────────────────────────
    const result = await chat.sendMessageStream(message);

    let fullResponse = '';

    for await (const chunk of result.stream) {
      const delta = chunk.text();
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    // ── Persist assistant reply ───────────────────────────
    conversation.messages.push({ role: 'assistant', content: fullResponse });

    // Auto-title: generate a short title from the first user message
    if (conversation.messages.filter((m) => m.role === 'user').length === 1) {
      const titleModel = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      });
      const titleResult = await titleModel.generateContent(
        `Generate a short, descriptive title (max 6 words) for a conversation that starts with the following user message. Return only the title, no punctuation.\n\n${message}`
      );
      conversation.title =
        titleResult.response.text().trim() || 'New Conversation';
    }

    await conversation.save();

    res.write(
      `data: ${JSON.stringify({
        done: true,
        conversationId: conversation._id,
        title: conversation.title,
      })}\n\n`
    );
    res.end();
  } catch (err) {
    console.error('Stream error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── POST /api/chat/regenerate ─────────────────────────────
router.post('/regenerate', async (req, res) => {
  const { conversationId, tone = 'professional' } = req.body;

  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId is required.' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Remove the last assistant message so we regenerate it
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (lastMsg?.role === 'assistant') {
      conversation.messages.pop();
    }

    // The last remaining message should be the user prompt to regenerate from
    const lastUserMsg =
      [...conversation.messages].reverse().find((m) => m.role === 'user')
        ?.content || '';

    const history = buildGeminiHistory(
      conversation.messages.slice(0, -1)
    );

    const systemPrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.professional;

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history });

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const result = await chat.sendMessageStream(lastUserMsg);

    let fullResponse = '';

    for await (const chunk of result.stream) {
      const delta = chunk.text();
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    conversation.messages.push({ role: 'assistant', content: fullResponse });
    await conversation.save();

    res.write(
      `data: ${JSON.stringify({ done: true, conversationId: conversation._id })}\n\n`
    );
    res.end();
  } catch (err) {
    console.error('Regenerate error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

export default router;
