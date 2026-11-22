import React from 'react';
import { ChatProvider } from './context/ChatContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';

export default function App() {
  return (
    <ChatProvider>
      <div className="flex h-screen overflow-hidden bg-[#0f1117]">
        <Sidebar />
        <ChatWindow />
      </div>
    </ChatProvider>
  );
}
