import React, { createContext, useContext, useState, useCallback } from 'react';
import { fetchConversations, fetchConversationById, deleteConversation } from '../api/conversations.js';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  // ── Sidebar list ──────────────────────────────────────
  const [conversations, setConversations]       = useState([]);
  const [loadingSidebar, setLoadingSidebar]     = useState(false);

  // ── Active chat ───────────────────────────────────────
  const [activeId, setActiveId]                 = useState(null);
  const [messages, setMessages]                 = useState([]);
  const [loadingChat, setLoadingChat]           = useState(false);

  // ── Streaming state ───────────────────────────────────
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming]            = useState(false);

  // ── Tone Toggle ───────────────────────────────────────
  const [tone, setTone]                         = useState('professional');

  // ── Load sidebar list ─────────────────────────────────
  const loadConversations = useCallback(async () => {
    setLoadingSidebar(true);
    try {
      const data = await fetchConversations();
      setConversations(data);
    } finally {
      setLoadingSidebar(false);
    }
  }, []);

  // ── Open a conversation from sidebar ──────────────────
  const openConversation = useCallback(async (id) => {
    setLoadingChat(true);
    setActiveId(id);
    setStreamingContent('');
    try {
      const data = await fetchConversationById(id);
      setMessages(data.messages);
      setTone(data.tone || 'professional');
    } finally {
      setLoadingChat(false);
    }
  }, []);

  // ── Start a brand-new chat ─────────────────────────────
  const newChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setStreamingContent('');
    setTone('professional');
  }, []);

  // ── Append a streamed chunk ────────────────────────────
  const appendStream = useCallback((delta) => {
    setStreamingContent((prev) => prev + delta);
  }, []);

  // ── Finalise stream → push completed message ──────────
  const finaliseStream = useCallback((fullContent, newConversationId, title) => {
    setIsStreaming(false);
    setStreamingContent('');
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: fullContent, timestamp: new Date().toISOString() },
    ]);

    if (newConversationId) {
      setActiveId(newConversationId);
      // Update sidebar list entry title if it exists, otherwise prepend
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === newConversationId);
        if (exists) {
          return prev.map((c) =>
            c._id === newConversationId ? { ...c, title, updatedAt: new Date().toISOString() } : c
          );
        }
        return [
          { _id: newConversationId, title: title || 'New Conversation', updatedAt: new Date().toISOString() },
          ...prev,
        ];
      });
    }
  }, []);

  // ── Add user message optimistically ───────────────────
  const addUserMessage = useCallback((content) => {
    setMessages((prev) => [
      ...prev,
      { role: 'user', content, timestamp: new Date().toISOString() },
    ]);
  }, []);

  // ── Delete conversation ────────────────────────────────
  const removeConversation = useCallback(async (id) => {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c._id !== id));
    if (activeId === id) newChat();
  }, [activeId, newChat]);

  // ── Update title in sidebar after auto-name ───────────
  const updateConversationTitle = useCallback((id, title) => {
    setConversations((prev) =>
      prev.map((c) => (c._id === id ? { ...c, title } : c))
    );
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations, loadingSidebar, loadConversations,
        activeId, messages, loadingChat,
        openConversation, newChat,
        streamingContent, isStreaming, setIsStreaming,
        appendStream, finaliseStream, addUserMessage,
        tone, setTone,
        removeConversation, updateConversationTitle,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
