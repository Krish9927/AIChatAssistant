import { Router } from 'express';
import Conversation from '../models/Conversation.js';

const router = Router();

// ── GET /api/conversations ────────────────────────────────
// Returns all conversations (id + title + tone + updatedAt) for the sidebar
router.get('/', async (_req, res) => {
  try {
    const conversations = await Conversation.find(
      {},
      { title: 1, tone: 1, updatedAt: 1, createdAt: 1 }
    ).sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/conversations/:id ────────────────────────────
// Returns full conversation with all messages
router.get('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/conversations/:id ────────────────────────
// Deletes a conversation thread
router.delete('/:id', async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/conversations/:id/title ───────────────────
// Allows manually renaming a conversation title
router.patch('/:id/title', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { title: title.trim() },
      { new: true, select: 'title tone updatedAt' }
    );
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
