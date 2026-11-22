import React, { useState } from 'react';
import { Copy, Check, RefreshCw, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatBubble({ message, isLast, onRegenerate, isStreaming }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
          isUser ? 'bg-[#4f6ef7]' : 'bg-[#2a2d3e]'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-[#4f6ef7] text-white rounded-tr-sm'
              : 'bg-[#1a1d27] border border-[#2a2d3e] text-slate-200 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <span className="text-[10px] text-slate-600 px-1">
            {new Date(message.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        )}

        {/* Action buttons — AI messages only */}
        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-white px-2 py-1 rounded-md hover:bg-[#2a2d3e] transition-colors"
              title="Copy response"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            {/* Regenerate — only on last AI message */}
            {isLast && !isStreaming && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-white px-2 py-1 rounded-md hover:bg-[#2a2d3e] transition-colors"
                title="Regenerate response"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
