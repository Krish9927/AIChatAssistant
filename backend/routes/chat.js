import { Router } from 'express';
import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Tone → System Instruction Map ────────────────────────
const TONE_PROMPTS = {
  professional:
    'You are a professional AI assistant. Respond in a formal, precise, and structured manner. Use clear language suitable for a business or academic context.',
  casual:
    'You are a friendly AI assistant. Respond in a relaxed, conversational, and approachable tone. Feel free to use everyday language and be warm.',
  concise:
    'You are a concise AI assistant. Respond in as few words as possible while still being accurate and helpful. Avoid any unnecessary explanation.',
};

// ── POST /api/chat/stream ─────────────────────────────────
// Streams an AI response back using Server-Sent Events (SSE)
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

    // Update tone if changed
    conversation.tone = tone;

    // Append the user message
    conversation.messages.push({ role: 'user', content: message });

    // Build the message array for OpenAI
    const systemPrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.professional;
    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // ── SSE Headers ──────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // ── OpenAI Streaming ──────────────────────────────────
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: openAiMessages,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullResponse += delta;
        // Send each token as an SSE event
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    // ── Persist assistant reply ───────────────────────────
    conversation.messages.push({ role: 'assistant', content: fullResponse });

    // Auto-title: generate a short title from the first user message (Bonus Feature)
    if (conversation.messages.filter((m) => m.role === 'user').length === 1) {
      const titleRes = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Generate a short, descriptive title (max 6 words) for a conversation that starts with the following user message. Return only the title, no punctuation.',
          },
          { role: 'user', content: message },
        ],
        max_tokens: 20,
      });
      conversation.title =
        titleRes.choices[0]?.message?.content?.trim() || 'New Conversation';
    }

    await conversation.save();

    // Send the final event with conversationId and title
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
// Regenerates the last AI response (Bonus Feature)
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

    // Remove last assistant message so we can regenerate it
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (lastMsg?.role === 'assistant') {
      conversation.messages.pop();
    }

    const systemPrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.professional;
    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: openAiMessages,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
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
