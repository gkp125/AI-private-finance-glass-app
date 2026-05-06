import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { callAI } from '../services/aiService';
import './AiAssistant.css';

const QUICK_PROMPTS = [
  { icon: '💡', text: 'Spending insights', prompt: 'Analyze my spending patterns and tell me what stands out most.' },
  { icon: '📊', text: 'Budget tips', prompt: 'Give me 3 specific actionable tips to optimize my budget based on my transactions.' },
  { icon: '💰', text: 'Save more', prompt: 'Based on my transactions, where can I cut back to save more money this month?' },
  { icon: '📈', text: 'Income ideas', prompt: 'What strategies could help me grow my income based on my current financial profile?' },
  { icon: '🎯', text: 'Budget plan', prompt: 'Create a monthly budget plan based on my income and spending history.' },
  { icon: '🔮', text: 'Next month', prompt: 'Forecast my likely income and expenses for next month based on my history.' },
];

function buildContext(transactions, categories, books) {
  const income = transactions.filter((t) => t.type === 'income');
  const expense = transactions.filter((t) => t.type === 'expense');
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expense.reduce((s, t) => s + t.amount, 0);

  const catMap = {};
  expense.forEach((t) => {
    if (!catMap[t.category]) catMap[t.category] = 0;
    catMap[t.category] += t.amount;
  });

  const topCats = Object.entries(catMap)
    .map(([id, amt]) => {
      const cat = categories.expense.find((c) => c.id === id);
      return { name: cat?.name || id, amt };
    })
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 5)
    .map((x) => `${x.name}: ${x.amt.toLocaleString()}`)
    .join(', ');

  const recentTxns = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
    .map((t) => {
      const cat = t.type === 'income'
        ? categories.income.find((c) => c.id === t.category)
        : categories.expense.find((c) => c.id === t.category);
      return `${t.date}: ${t.type === 'income' ? '+' : '-'}${t.amount} (${cat?.name || t.category}) - ${t.note || 'no note'}`;
    })
    .join('\n');

  return `FINANCIAL CONTEXT:
- Total Income: ${totalIncome.toLocaleString()}
- Total Expense: ${totalExpense.toLocaleString()}
- Net Balance: ${(totalIncome - totalExpense).toLocaleString()}
- Savings Rate: ${totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0}%
- Active Books: ${books.map((b) => b.name).join(', ')}
- Top Expense Categories: ${topCats}

RECENT TRANSACTIONS (last 10):
${recentTxns}`;
}

// ── Provider Settings Panel ──────────────────────────────────────────────────
function ProviderSettings({ onClose }) {
  const { settings, updateSettings } = useStore();
  const [tab, setTab] = useState(settings.aiProvider || 'claude');
  const [claudeKey, setClaudeKey] = useState(settings.claudeKey || '');
  const [geminiKey, setGeminiKey] = useState(settings.geminiKey || '');
  const [showClaude, setShowClaude] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'loading' | 'ok' | 'fail'
  const [testError, setTestError] = useState('');

  const save = () => {
    updateSettings({ aiProvider: tab, claudeKey: claudeKey.trim(), geminiKey: geminiKey.trim() });
    onClose();
  };

  const testConnection = async () => {
    setTestStatus('loading');
    setTestError('');
    try {
      const fakeSettings = { aiProvider: tab, claudeKey: claudeKey.trim(), geminiKey: geminiKey.trim() };
      await callAI('Say OK', fakeSettings);
      setTestStatus('ok');
    } catch (err) {
      setTestStatus('fail');
      setTestError(err.message || 'Unknown error');
    }
  };

  return (
    <div className="ai-provider-settings animate-scale-in">
      <div className="ai-ps-header">
        <span>AI Provider Settings</span>
        <button className="glass-icon-btn" onClick={onClose}>✕</button>
      </div>

      {/* Provider tabs */}
      <div className="ai-provider-tabs">
        <button className={`ai-ptab ${tab === 'claude' ? 'ai-ptab-active' : ''}`} onClick={() => { setTab('claude'); setTestStatus(null); }}>
          Claude (Anthropic)
        </button>
        <button className={`ai-ptab ${tab === 'gemini' ? 'ai-ptab-active' : ''}`} onClick={() => { setTab('gemini'); setTestStatus(null); }}>
          Gemini <span className="ai-free-badge">Free</span>
        </button>
      </div>

      {tab === 'claude' && (
        <div className="ai-ps-section">
          <label className="form-label">Anthropic API Key</label>
          <div className="ai-key-row">
            <input
              className="glass-input"
              type={showClaude ? 'text' : 'password'}
              placeholder="sk-ant-api..."
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
            />
            <button className="glass-icon-btn" onClick={() => setShowClaude(!showClaude)}>{showClaude ? '🙈' : '👁'}</button>
          </div>
          <div className="ai-key-hint">
            Model: <strong>claude-opus-4-5</strong> ·{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="ai-link">Get key at console.anthropic.com</a>
          </div>
        </div>
      )}

      {tab === 'gemini' && (
        <div className="ai-ps-section">
          <label className="form-label">Gemini API Key</label>
          <div className="ai-key-row">
            <input
              className="glass-input"
              type={showGemini ? 'text' : 'password'}
              placeholder="AIza..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
            <button className="glass-icon-btn" onClick={() => setShowGemini(!showGemini)}>{showGemini ? '🙈' : '👁'}</button>
          </div>
          <div className="ai-key-hint">
            Model: <strong>gemini-1.5-flash (free tier)</strong> ·{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="ai-link">Free key — no card needed</a>
          </div>
        </div>
      )}

      {/* Test + status */}
      <button className="glass-button" style={{ width: '100%', marginBottom: 8 }} onClick={testConnection} disabled={testStatus === 'loading'}>
        {testStatus === 'loading' ? '⏳ Testing...' : '🔌 Test Connection'}
      </button>
      {testStatus === 'ok' && <div className="ai-test-ok">✅ Connected</div>}
      {testStatus === 'fail' && <div className="ai-test-fail">❌ Failed — {testError}</div>}

      <button className="glass-button glass-button-primary" style={{ width: '100%' }} onClick={save}>
        Save
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AiAssistant() {
  const {
    toggleAiChat,
    aiMessages, addAiMessage, clearAiMessages,
    transactions, categories, books,
    settings,
    aiPanelCollapsed, setAiPanelCollapsed,
  } = useStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const providerLabel = settings.aiProvider === 'gemini' ? 'Gemini 1.5 Flash' : 'Claude claude-opus-4-5';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  useEffect(() => {
    if (!aiPanelCollapsed && aiMessages.length === 0) {
      addAiMessage({
        role: 'assistant',
        content: `Hey there! 👋 I'm your **CashBook AI**.\n\nI can see your financial data and I'm ready to help you:\n- Analyze spending patterns\n- Identify saving opportunities\n- Create budget plans\n\nWhat would you like to explore today?`,
      });
    }
  }, [aiPanelCollapsed]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    const userMsg = text.trim();
    setInput('');
    addAiMessage({ role: 'user', content: userMsg });
    setIsLoading(true);

    try {
      const context = buildContext(transactions, categories, books);
      const fullPrompt = `You are CashBook AI, a personal finance assistant. Be concise, insightful, and actionable. Use markdown for readability.\n\n${context}\n\nUser: ${userMsg}`;
      const reply = await callAI(fullPrompt, settings);
      addAiMessage({ role: 'assistant', content: reply, model: providerLabel });
    } catch (err) {
      addAiMessage({ role: 'assistant', content: `⚠️ ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="ai-panel">
      {/* Header — always visible */}
      <div className="ai-header" onClick={() => aiPanelCollapsed && setAiPanelCollapsed(false)}>
        <div className="ai-header-left">
          <div className="ai-avatar">
            <span className="ai-avatar-icon">✦</span>
            <span className="ai-status-dot" />
          </div>
          <div>
            <div className="ai-title">CashBook AI</div>
            {!aiPanelCollapsed && <div className="ai-subtitle">via {providerLabel}</div>}
          </div>
        </div>
        <div className="ai-header-actions">
          {!aiPanelCollapsed && aiMessages.length > 0 && (
            <button className="glass-icon-btn" onClick={(e) => { e.stopPropagation(); clearAiMessages(); }} title="Clear chat">↺</button>
          )}
          {!aiPanelCollapsed && (
            <button className="glass-icon-btn" onClick={(e) => { e.stopPropagation(); setShowProviderSettings(!showProviderSettings); }} title="AI Settings">⚙</button>
          )}
          <button
            className="glass-icon-btn"
            onClick={(e) => { e.stopPropagation(); setAiPanelCollapsed(!aiPanelCollapsed); }}
            title={aiPanelCollapsed ? 'Expand' : 'Minimize'}
          >
            {aiPanelCollapsed ? '⌃' : '⌄'}
          </button>
          <button className="glass-icon-btn" onClick={toggleAiChat} title="Close">✕</button>
        </div>
      </div>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {!aiPanelCollapsed && (
          <motion.div
            key="ai-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {/* Provider Settings */}
            <AnimatePresence>
              {showProviderSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <ProviderSettings onClose={() => setShowProviderSettings(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="ai-messages">
              {aiMessages.map((msg, i) => (
                <ChatMessage key={msg.id || i} msg={msg} />
              ))}

              {isLoading && (
                <div className="ai-thinking animate-fade-in">
                  <div className="ai-thinking-avatar">✦</div>
                  <div className="ai-thinking-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {aiMessages.length <= 1 && !isLoading && (
              <div className="quick-prompts animate-slide-up">
                {QUICK_PROMPTS.map((qp) => (
                  <button key={qp.text} className="quick-prompt-btn" onClick={() => sendMessage(qp.prompt)}>
                    <span className="qp-icon">{qp.icon}</span>
                    <span className="qp-text">{qp.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="ai-input-area">
              <div className="ai-input-wrap">
                <textarea
                  ref={inputRef}
                  className="ai-textarea"
                  placeholder="Ask about your finances..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  className={`ai-send-btn ${input.trim() && !isLoading ? 'ai-send-active' : ''}`}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                >
                  ↑
                </button>
              </div>
              <div className="ai-input-hint">Enter to send · Shift+Enter for new line</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';

  const renderMarkdown = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h3 key={i} style={{ fontSize: 13, fontWeight: 700, margin: '6px 0 3px', color: 'var(--text-primary)' }}>{line.slice(3)}</h3>;
      if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} style={{ marginLeft: 14, marginBottom: 2 }}>{formatInline(line.slice(2))}</li>;
      if (line === '') return <div key={i} style={{ height: 5 }} />;
      return <p key={i} style={{ lineHeight: 1.6, margin: '2px 0' }}>{formatInline(line)}</p>;
    });
  };

  const formatInline = (text) => {
    return text.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: '0.85em' }}>{part.slice(1, -1)}</code>;
      return part;
    });
  };

  return (
    <div className={`chat-msg ${isUser ? 'chat-msg-user' : 'chat-msg-ai'} animate-fade-in`}>
      {!isUser && <div className="chat-msg-avatar">✦</div>}
      <div className={`chat-msg-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
        <div className="chat-msg-content">{renderMarkdown(msg.content)}</div>
        <div className="chat-msg-time">
          {msg.model && <span className="chat-model-tag">via {msg.model}</span>}
          {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
