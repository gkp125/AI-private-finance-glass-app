import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/format';
import Anthropic from '@anthropic-ai/sdk';
import './AiAssistant.css';

const QUICK_PROMPTS = [
  { icon: '📊', text: 'Analyze my spending', prompt: 'Analyze my spending patterns and tell me what stands out most.' },
  { icon: '💡', text: 'Save more tips', prompt: 'Based on my transactions, give me 3 specific actionable tips to save more money.' },
  { icon: '📈', text: 'Income growth ideas', prompt: 'What strategies could help me grow my income based on my current financial profile?' },
  { icon: '⚠️', text: 'Risk areas', prompt: 'Are there any financial risks or red flags in my spending patterns?' },
  { icon: '🎯', text: 'Budget plan', prompt: 'Create a monthly budget plan based on my income and spending history.' },
  { icon: '🔮', text: 'Next month forecast', prompt: 'Forecast my likely income and expenses for next month based on my history.' },
];

function buildContext(transactions, categories, books) {
  const income = transactions.filter(t => t.type === 'income');
  const expense = transactions.filter(t => t.type === 'expense');
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expense.reduce((s, t) => s + t.amount, 0);

  const catMap = {};
  expense.forEach(t => {
    if (!catMap[t.category]) catMap[t.category] = 0;
    catMap[t.category] += t.amount;
  });

  const topCats = Object.entries(catMap)
    .map(([id, amt]) => {
      const cat = categories.expense.find(c => c.id === id);
      return `${cat?.name || id}: ₹${amt.toLocaleString()}`;
    })
    .sort((a, b) => {
      const av = parseInt(a.split('₹')[1].replace(/,/g, ''));
      const bv = parseInt(b.split('₹')[1].replace(/,/g, ''));
      return bv - av;
    })
    .slice(0, 5)
    .join(', ');

  const recentTxns = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
    .map(t => {
      const cat = t.type === 'income'
        ? categories.income.find(c => c.id === t.category)
        : categories.expense.find(c => c.id === t.category);
      return `${t.date}: ${t.type === 'income' ? '+' : '-'}₹${t.amount} (${cat?.name || t.category}) - ${t.note || 'no note'}`;
    })
    .join('\n');

  return `
FINANCIAL CONTEXT (as of March 2026):
- Total Income: ₹${totalIncome.toLocaleString()}
- Total Expense: ₹${totalExpense.toLocaleString()}
- Net Balance: ₹${(totalIncome - totalExpense).toLocaleString()}
- Savings Rate: ${totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0}%
- Active Books: ${books.map(b => b.name).join(', ')}
- Top Expense Categories: ${topCats}

RECENT TRANSACTIONS (last 10):
${recentTxns}
`;
}

export default function AiAssistant() {
  const { toggleAiChat, aiMessages, addAiMessage, clearAiMessages, transactions, categories, books, aiAnalysisCache } = useStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cb_anthropic_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('cb_anthropic_key'));
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  useEffect(() => {
    if (!showKeyInput) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showKeyInput]);

  // Send greeting on first open
  useEffect(() => {
    if (aiMessages.length === 0 && !showKeyInput) {
      const context = aiAnalysisCache;
      addAiMessage({
        role: 'assistant',
        content: `Hey there! 👋 I'm your **CashBook AI**, powered by Claude.\n\nI can see your financial data and I'm ready to help you:\n- Analyze spending patterns\n- Identify saving opportunities\n- Create budget plans\n- Answer any finance questions\n\nWhat would you like to explore today?`,
      });
    }
  }, [showKeyInput]);

  const saveKey = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('cb_anthropic_key', apiKey.trim());
    setShowKeyInput(false);
    addAiMessage({
      role: 'assistant',
      content: `Hey there! 👋 I'm your **CashBook AI**, powered by Claude.\n\nI can see your financial data and I'm ready to help you:\n- Analyze spending patterns\n- Identify saving opportunities\n- Create budget plans\n- Answer any finance questions\n\nWhat would you like to explore today?`,
    });
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    setInput('');
    addAiMessage({ role: 'user', content: userMsg });
    setIsLoading(true);

    try {
      const key = localStorage.getItem('cb_anthropic_key');
      if (!key) {
        setShowKeyInput(true);
        setIsLoading(false);
        return;
      }

      const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
      const context = buildContext(transactions, categories, books);

      const history = aiMessages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are CashBook AI, a highly intelligent personal finance assistant embedded in a cashbook app. You have access to the user's real financial data shown below. Be concise, insightful, and actionable. Use emojis sparingly for clarity. Format responses with markdown for readability. Always ground your advice in the actual numbers provided.

${context}`,
        messages: [
          ...history,
          { role: 'user', content: userMsg },
        ],
      });

      const assistantText = response.content[0]?.text || 'Sorry, I could not generate a response.';
      addAiMessage({ role: 'assistant', content: assistantText });
    } catch (err) {
      const errMsg = err.message?.includes('401') || err.message?.includes('authentication')
        ? '⚠️ Invalid API key. Please check your Anthropic API key in settings.'
        : err.message?.includes('429')
        ? '⚠️ Rate limit reached. Please wait a moment and try again.'
        : `⚠️ Error: ${err.message || 'Something went wrong'}`;
      addAiMessage({ role: 'assistant', content: errMsg });
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
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-left">
          <div className="ai-avatar">
            <span className="ai-avatar-icon">✦</span>
            <span className="ai-status-dot" />
          </div>
          <div>
            <div className="ai-title">CashBook AI</div>
            <div className="ai-subtitle">Powered by Claude · Liquid Intelligence</div>
          </div>
        </div>
        <div className="ai-header-actions">
          {aiMessages.length > 0 && (
            <button className="glass-icon-btn" onClick={clearAiMessages} title="Clear chat">
              ↺
            </button>
          )}
          <button className="glass-icon-btn" onClick={() => setShowKeyInput(!showKeyInput)} title="API Key">
            🔑
          </button>
          <button className="glass-icon-btn" onClick={toggleAiChat} title="Close">
            ✕
          </button>
        </div>
      </div>

      {/* API Key Input */}
      {showKeyInput && (
        <div className="ai-key-section animate-slide-up">
          <div className="ai-key-label">Enter your Anthropic API Key</div>
          <div className="ai-key-row">
            <input
              className="glass-input"
              type="password"
              placeholder="sk-ant-api..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              style={{ fontSize: 13, padding: '10px 14px' }}
            />
            <button className="glass-button glass-button-primary" onClick={saveKey} style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
              Save
            </button>
          </div>
          <div className="ai-key-note">
            Your key is stored locally and never sent to our servers.
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', marginLeft: 4 }}>
              Get a key →
            </a>
          </div>
        </div>
      )}

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
            <button
              key={qp.text}
              className="quick-prompt-btn"
              onClick={() => sendMessage(qp.prompt)}
            >
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
            placeholder="Ask me anything about your finances..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading || showKeyInput}
          />
          <button
            className={`ai-send-btn ${input.trim() && !isLoading ? 'ai-send-active' : ''}`}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <span>↑</span>
          </button>
        </div>
        <div className="ai-input-hint">Press Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';

  // Simple markdown renderer
  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i}><strong>{line.slice(2, -2)}</strong></p>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i} style={{ marginLeft: 12, marginBottom: 2 }}>{formatInline(line.slice(2))}</li>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{line.slice(3)}</h3>;
      }
      if (line === '') return <div key={i} style={{ height: 6 }} />;
      return <p key={i} style={{ lineHeight: 1.6 }}>{formatInline(line)}</p>;
    });
  };

  const formatInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: '0.9em', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className={`chat-msg ${isUser ? 'chat-msg-user' : 'chat-msg-ai'} animate-fade-in`}>
      {!isUser && (
        <div className="chat-msg-avatar">✦</div>
      )}
      <div className={`chat-msg-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
        <div className="chat-msg-content">
          {renderMarkdown(msg.content)}
        </div>
        {msg.timestamp && (
          <div className="chat-msg-time">
            {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}
