import React from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { Briefcase, Smile, Zap } from 'lucide-react';

const TONES = [
  { value: 'professional', label: 'Professional', icon: Briefcase },
  { value: 'casual',       label: 'Casual',       icon: Smile     },
  { value: 'concise',      label: 'Concise',      icon: Zap       },
];

export default function ToneToggle() {
  const { tone, setTone, isStreaming } = useChat();

  return (
    <div className="flex items-center gap-1 bg-[#1a1d27] border border-[#2a2d3e] rounded-xl p-1">
      {TONES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTone(value)}
          disabled={isStreaming}
          title={label}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            tone === value
              ? 'bg-[#4f6ef7] text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-[#2a2d3e]'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}
