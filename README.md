# 🤖 AI Chat Assistant

> Quantiphi × NIT Allahabad — Vibe Coding Round Submission

A full-stack intelligent chat interface with real-time streaming, conversation history, tone customization, and two bonus features.

---

## ✨ Features

### Required
| Feature | Details |
|---|---|
| **Chat Interface** | Scrollable conversation view with distinct bubbles for user and AI |
| **Streaming View** | Text appears token-by-token via Server-Sent Events (SSE) |
| **History Sidebar** | Lists all past conversation threads; click to restore |
| **OpenAI Integration** | Connects to OpenAI Chat Completions API (`gpt-4o-mini` by default) |
| **MongoDB Persistence** | Stores each conversation with timestamp, user prompt, and AI response |
| **Tone Toggle** | Switch between **Professional**, **Casual**, and **Concise** — passed as a system instruction modifier to every API call |

### Bonus
| Feature | Details |
|---|---|
| **Copy & Regenerate** | Copy any AI response to clipboard; regenerate the last response with one click |
| **Auto Chat Title** | On the first message of a new conversation, the AI generates a short descriptive title (≤ 6 words) automatically |

---

## 🗂️ Project Structure

```
AIChatAssistant/
├── backend/
│   ├── models/
│   │   └── Conversation.js     # Mongoose schema (messages, tone, title, timestamps)
│   ├── routes/
│   │   ├── chat.js             # POST /api/chat/stream  POST /api/chat/regenerate
│   │   └── conversations.js    # GET / GET/:id / DELETE/:id / PATCH/:id/title
│   ├── server.js               # Express app + MongoDB connection
│   ├── package.json            # ESM, dependencies
│   └── .env.example            # Environment variable template
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── chat.js          # streamMessage(), regenerateMessage() — SSE readers
    │   │   └── conversations.js # fetch / delete / rename helpers
    │   ├── components/
    │   │   ├── Sidebar.jsx      # History list + New Chat button
    │   │   ├── ToneToggle.jsx   # Professional / Casual / Concise switcher
    │   │   ├── ChatWindow.jsx   # Message list + empty state
    │   │   ├── ChatBubble.jsx   # User & AI bubbles with copy/regenerate
    │   │   ├── StreamingBubble.jsx  # Live streaming bubble with blinking cursor
    │   │   └── ChatInput.jsx    # Auto-resize textarea + send button
    │   ├── context/
    │   │   └── ChatContext.jsx  # Global state (messages, streaming, tone, sidebar)
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css            # Tailwind directives + custom animations
    ├── index.html
    ├── vite.config.js           # Vite + /api proxy to backend
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local) or a MongoDB Atlas connection string
- An OpenAI API key

---

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/AIChatAssistant.git
cd AIChatAssistant
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create your `.env` file from the template:

```bash
copy .env.example .env     # Windows
# cp .env.example .env     # Mac/Linux
```

Edit `.env` and fill in your values:

```env
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb://localhost:27017/ai_chat_assistant
PORT=5000
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev      # development (nodemon)
# npm start      # production
```

The server runs on **http://localhost:5000**

---

### 3. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

The app opens at **http://localhost:5173**

> The Vite dev server proxies all `/api` requests to `http://localhost:5000` automatically.

---

## 🔌 API Reference

### Chat

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/chat/stream` | `{ conversationId?, message, tone }` | Stream AI response (SSE) |
| `POST` | `/api/chat/regenerate` | `{ conversationId, tone }` | Regenerate last AI response (SSE) |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/conversations` | List all conversations (sidebar) |
| `GET` | `/api/conversations/:id` | Get full conversation with messages |
| `DELETE` | `/api/conversations/:id` | Delete a conversation |
| `PATCH` | `/api/conversations/:id/title` | Rename a conversation |

---

## 🎨 Tone System Prompts

| Tone | System Instruction |
|------|-------------------|
| **Professional** | Formal, precise, structured — suitable for business/academic contexts |
| **Casual** | Relaxed, conversational, warm everyday language |
| **Concise** | Fewest words possible while remaining accurate and helpful |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Markdown, Lucide Icons |
| Backend | Node.js, Express, ESM (`"type": "module"`) |
| AI | OpenAI API (`gpt-4o-mini`) — SSE streaming |
| Database | MongoDB + Mongoose |
| State | React Context API |

---

## 📝 Architecture Notes

- **All business logic lives on the server.** The frontend only handles presentation and user interaction.
- **SSE streaming** is used instead of WebSockets — simpler, stateless, works over HTTP/1.1.
- **Tone preference** is persisted per conversation in MongoDB so the sidebar can restore it.
- **Auto-title** is generated from the first user message in a conversation using a lightweight second API call.

---

*Built for the Quantiphi × NIT Allahabad Vibe Coding Round — November 2026*
