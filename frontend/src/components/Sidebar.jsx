import React, { useEffect } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { MessageSquare, Plus, Trash2, Bot } from 'lucide-react';

export default function Sidebar() {
  const {
    conversations, loadingSidebar, loadConversations,
    activeId, openConversation,
    newChat, removeConversation,
  } = useChat();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#1a1d27] border-r border-[#2a2d3e]">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[#2a2d3e]">
        <Bot size={22} className="text-[#4f6ef7]" />
        <span className="font-semibold text-white text-sm tracking-wide">AI Chat Assistant</span>
      </div>

      {/* New Chat button */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={newChat}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-[#4f6ef7] hover:bg-[#3b55e6] text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {loadingSidebar ? (
          <p className="text-xs text-slate-500 px-2 py-4 text-center">Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-slate-500 px-2 py-4 text-center">No conversations yet.</p>
        ) : (
          conversations.map((c) => (
            <div
              key={c._id}
              onClick={() => openConversation(c._id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                activeId === c._id
                  ? 'bg-[#4f6ef7]/20 text-white'
                  : 'text-slate-400 hover:bg-[#2a2d3e] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare size={14} className="shrink-0" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-[10px] text-slate-500">{formatDate(c.updatedAt)}</p>
                </div>
              </div>

              {/* Delete button — visible on hover */}
              <button
                onClick={(e) => { e.stopPropagation(); removeConversation(c._id); }}
                className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition-opacity"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}
