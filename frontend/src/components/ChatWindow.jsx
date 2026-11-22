import React, { useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import ChatBubble from './ChatBubble.jsx';
import StreamingBubble from './StreamingBubble.jsx';
import ChatInput from './ChatInput.jsx';
import ToneToggle from './ToneToggle.jsx';
import { Bot } from 'lucide-react';
import { regenerateMessage } from '../api/chat.js';

export default function ChatWindow() {
  const {
    messages, streamingContent, isStreaming, activeId, loadingChat,
    tone, appendStream, finaliseStream, setIsStreaming,
  } = useChat();

  const bottomRef = useRef(null);

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleRegenerate = async () => {
    if (!activeId || isStreaming) return;

    setIsStreaming(true);

    await regenerateMessage({
      conversationId: activeId,
      tone,
      onDelta: (delta) => appendStream(delta),
      onDone: ({ conversationId, fullContent }) => {
        finaliseStream(fullContent, conversationId, null);
      },
      onError: (err) => {
        console.error('Regenerate error:', err);
        setIsStreaming(false);
      },
    });
  };

  if (loadingChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f1117]">
        <p className="text-slate-500 text-sm animate-pulse">Loading conversation…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0f1117] min-h-0">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#2a2d3e] shrink-0">
        <h1 className="text-sm font-semibold text-white">Chat</h1>
        <ToneToggle />
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && !isStreaming ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1a1d27] border border-[#2a2d3e] flex items-center justify-center">
              <Bot size={28} className="text-[#4f6ef7]" />
            </div>
            <div>
              <p className="text-white font-semibold">How can I help you today?</p>
              <p className="text-slate-500 text-sm mt-1">
                Pick a tone above and start typing below.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isLastAI =
                msg.role === 'assistant' &&
                idx === messages.length - 1 &&
                !isStreaming;
              return (
                <ChatBubble
                  key={idx}
                  message={msg}
                  isLast={isLastAI}
                  isStreaming={isStreaming}
                  onRegenerate={isLastAI ? handleRegenerate : null}
                />
              );
            })}

            {/* Streaming bubble */}
            {isStreaming && <StreamingBubble content={streamingContent} />}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <ChatInput />
    </div>
  );
}
