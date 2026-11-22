import mongoose from 'mongoose';

// Sub-schema for individual messages inside a conversation
const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Main conversation schema
const ConversationSchema = new mongoose.Schema(
  {
    // Auto-generated title from first message (Bonus Feature)
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
    },
    // Tone Toggle — stored so the sidebar can restore context
    tone: {
      type: String,
      enum: ['professional', 'casual', 'concise'],
      default: 'professional',
    },
    // All messages in this thread
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Conversation', ConversationSchema);
