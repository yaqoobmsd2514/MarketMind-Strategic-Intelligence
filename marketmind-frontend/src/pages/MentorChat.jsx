import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './MentorChat.css';

const STARTERS = [
  '💡 How do I validate my business idea?',
  '🚀 What are the biggest mistakes first-time founders make?',
  '💰 How should I price my product in Pakistan?',
  '👥 How do I find my first 100 customers?',
  '📊 What does a good MVP look like?',
  '📋 How do I write a business plan?',
  '🏦 How do I get funding in Pakistan?',
  '📣 What digital marketing works best in Pakistan?',
];

export default function MentorChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [activeIdea, setActiveIdea] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/ideas').then(r => {
      setIdeas(r.data.ideas || []);
      if (r.data.ideas?.length) setActiveIdea(r.data.ideas[0]);
    }).catch(() => {});
    setMessages([{
      role: 'assistant',
      content: `Hey ${user?.name?.split(' ')[0] || 'Founder'}! 👋\n\nI'm your AI Business Mentor — trained on startup frameworks, Pakistan market dynamics, and entrepreneurship best practices.\n\nI can help you with strategy, pricing, marketing, fundraising, legal questions, and more. What's on your mind?`,
      ts: new Date()
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text = input.trim()) => {
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text, ts: new Date() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/ai/mentor-chat', {
        message: text,
        conversationHistory: history,
        ideaContext: activeIdea ? {
          product: activeIdea.product, industry: activeIdea.industry,
          targetCity: activeIdea.targetCity, stage: activeIdea.stage,
          analysis: activeIdea.analysis
        } : null
      });
      setMessages(p => [...p, { role: 'assistant', content: res.data.reply, ts: new Date() }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'I hit a snag — please try again.', ts: new Date(), error: true }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const fmt = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>{line}{i < text.split('\n').length - 1 && <br />}</span>
    ));
  };

  return (
    <div className="mentor-page">
      {/* Sidebar */}
      <div className="mentor-sidebar">
        <div className="mentor-profile-card">
          <div className="mp-avatar">🧠</div>
          <h3>AI Business Mentor</h3>
          <p>Expert startup advisor · 24/7 available</p>
          <div className="mp-status"><span className="mp-dot" />Online</div>
        </div>

        {ideas.length > 0 && (
          <div className="ms-section">
            <div className="ms-label">Idea Context</div>
            <div className="ms-ideas">
              {ideas.slice(0, 5).map(idea => (
                <button key={idea._id}
                  className={`ms-idea-btn ${activeIdea?._id === idea._id ? 'active' : ''}`}
                  onClick={() => setActiveIdea(idea)}>
                  <span className="msib-name">{idea.product}</span>
                  <span className="msib-city">{idea.targetCity}</span>
                </button>
              ))}
              {activeIdea && (
                <button className="ms-clear" onClick={() => setActiveIdea(null)}>✕ Remove context</button>
              )}
            </div>
          </div>
        )}

        <div className="ms-section">
          <div className="ms-label">Ask me about</div>
          <div className="ms-starters">
            {STARTERS.map((s, i) => (
              <button key={i} className="starter-chip" onClick={() => send(s.replace(/^[^\s]+\s/, ''))}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="chat-panel">
        <div className="chat-header">
          <div className="ch-left">
            <div className="ch-av">🧠</div>
            <div>
              <div className="ch-name">AI Business Mentor</div>
              <div className="ch-sub">
                <span className="ch-dot" />
                {activeIdea ? `Context: ${activeIdea.product} · ${activeIdea.targetCity}` : 'General advice mode'}
              </div>
            </div>
          </div>
          <div className="ch-msgs-count">{messages.length} messages</div>
        </div>

        <div className="messages-area">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div key={i} className={`msg-wrap ${m.role}`}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                {m.role === 'assistant' && <div className="msg-avatar">🧠</div>}
                <div className={`msg-bubble ${m.error ? 'error' : ''}`}>
                  <div className="msg-text">{formatMessage(m.content)}</div>
                  <div className="msg-time">{fmt(m.ts)}</div>
                </div>
                {m.role === 'user' && <div className="msg-avatar user-av">{user?.name?.charAt(0) || 'U'}</div>}
              </motion.div>
            ))}
            {loading && (
              <motion.div className="msg-wrap assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="msg-avatar">🧠</div>
                <div className="msg-bubble typing-bubble">
                  <span /><span /><span />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrap">
            <textarea
              ref={inputRef}
              className="chat-textarea"
              placeholder="Ask anything about your startup… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button className="send-btn" onClick={() => send()} disabled={!input.trim() || loading}>
              {loading ? <span className="btn-spinner" /> : '↑'}
            </button>
          </div>
          <div className="chat-hint">Powered by Groq AI · Responses are not financial/legal advice</div>
        </div>
      </div>
    </div>
  );
}
