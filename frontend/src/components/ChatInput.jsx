import React, { useState, useRef, useCallback } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { streamMessage } from '../api/chat.js';
import { Send, Square } from 'lucide-react';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const abortRef = useRef(null);
  const textareaRef = useRef(null);

  const {
    activeId, tone,
    isStreaming, setIsStreaming,
    addUserMessage, appendStream, finaliseStream,
  } = useChat();

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    addUserMessage(text);
    setIsStreaming(true);

    await streamMessage({
      conversationId: activeId,
      message: text,
      tone,
      onDelta: (delta) => appendStream(delta),
      onDone: ({ conversationId, title, fullContent }) => {
        finaliseStream(fullContent, conversationId, title);
      },
      onError: (err) => {
        console.error('Stream error:', err);
        setIsStreaming(false);
      },
    });
  }, [input, isStreaming, activeId, tone, addUserMessage, appendStream, finaliseStream, setIsStreaming]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleChange = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  };

  return (
    <div className="shrink-0 px-4 pb-5 pt-3 border-t border-[#2a2d3e]">
      <div className="flex items-end gap-3 bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl px-4 py-3 focus-within:border-[#4f6ef7] transition-colors">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message AI… (Shift+Enter for new line)"
          disabled={isStreaming}
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none leading-relaxed disabled:opacity-50"
          style={{ minHeight: '24px', maxHeight: '160px' }}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="shrink-0 w-8 h-8 rounded-xl bg-[#4f6ef7] hover:bg-[#3b55e6] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          title="Send"
        >
          {isStreaming
            ? <Square size={14} className="text-white" fill="currentColor" />
            : <Send size={14} className="text-white" />
          }
        </button>
      </div>
      <p className="text-[10px] text-slate-600 mt-2 text-center">
        AI can make mistakes. Verify important information.
      </p>
    </div>
  );
}
