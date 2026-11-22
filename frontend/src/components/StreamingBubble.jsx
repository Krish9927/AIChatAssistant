import React from 'react';
import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function StreamingBubble({ content }) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#2a2d3e] text-white">
        <Bot size={14} />
      </div>

      {/* Bubble with blinking cursor */}
      <div className="max-w-[75%]">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#1a1d27] border border-[#2a2d3e] text-sm text-slate-200 leading-relaxed">
          {content ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <span className="text-slate-500 italic text-xs">Thinking…</span>
          )}
          {/* Blinking cursor */}
          <span className="inline-block w-[2px] h-[14px] bg-[#4f6ef7] ml-1 align-middle animate-blink" />
        </div>
      </div>
    </div>
  );
}
