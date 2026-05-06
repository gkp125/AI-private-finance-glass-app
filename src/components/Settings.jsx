import { useState } from 'react';
import { useStore, CURRENCIES } from '../store/useStore';
import './Settings.css';

const CATEGORY_COLORS = ['#34C759', '#0A84FF', '#FF453A', '#FF9F0A', '#BF5AF2', '#5E5CE6', '#FF375F', '#32ADE6', '#30B0C7', '#64D2FF', '#FFD60A', '#8E8E93'];
const CATEGORY_ICONS_INCOME = ['💼', '🏢', '📈', '🎁', '🏠', '💰', '🚀', '💡', '🎓', '🌍'];
const CATEGORY_ICONS_EXPENSE = ['🍔', '🚗', '🛍️', '💡', '🏥', '🎬', '📚', '🏡', '✈️', '📦', '🎮', '💊', '🐶', '☕', '🎵'];

function AddCategoryModal({ type, onClose }) {
  const { addCategory } = useStore();
  const [form, setForm] = useState({ name: '', icon: type === 'income' ? '💰' : '📦', color: '#0A84FF' });
  const icons = type === 'income' ? CATEGORY_ICONS_INCOME : CATEGORY_ICONS_EXPENSE;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    addCategory(type, form);
    onClose();
  };

  return (
    <div className="glass-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-modal animate-scale-in" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <div className="modal-title">Add {type === 'income' ? 'Income' : 'Expense'} Category</div>
          <button className="glass-icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input className="glass-input" placeholder="e.g., Subscriptions" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {icons.map((icon) => (
                <button key={icon} type="button"
                  style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${form.icon === icon ? 'rgba(10,132,255,0.6)' : 'var(--glass-border)'}`, background: form.icon === icon ? 'rgba(10,132,255,0.2)' : 'var(--glass-bg)', cursor: 'pointer', fontSize: 20 }}
                  onClick={() => setForm((f) => ({ ...f, icon }))}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORY_COLORS.map((color) => (
                <button key={color} type="button"
                  style={{ width: 30, height: 30, borderRadius: '50%', background: color, border: form.color === color ? '2px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: form.color === color ? `0 0 0 2px ${color}66` : 'none', transition: 'all 0.15s' }}
                  onClick={() => setForm((f) => ({ ...f, color }))} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="glass-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-button glass-button-primary" disabled={!form.name}>Add Category</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Settings() {
  const { categories, transactions, books, clearAiMessages, deleteCategory, settings, updateSettings } = useStore();
  const [addCatType, setAddCatType] = useState(null);

  const exportData = () => {
    const data = { transactions, books, categories, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashbook-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure? This will delete ALL transactions and reset the app.')) {
      localStorage.removeItem('cashbook-storage');
      window.location.reload();
    }
  };

  const handleDeleteCat = (type, cat) => {
    const used = transactions.some((t) => t.category === cat.id);
    if (used) {
      if (!window.confirm(`"${cat.name}" is used in ${transactions.filter((t) => t.category === cat.id).length} transaction(s). Deleting the category won't delete those transactions. Continue?`)) return;
    }
    deleteCategory(type, cat.id);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customize your CashBook experience</p>
      </div>

      <div className="settings-grid">
        {/* Currency */}
        <div className="glass-card settings-section animate-fade-in">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(255,159,10,0.2)', color: 'var(--orange)' }}>💱</div>
            <div>
              <div className="settings-section-title">Currency</div>
              <div className="settings-section-sub">App-wide currency display</div>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="currency-grid">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  className={`currency-btn ${settings.currency === c.code ? 'currency-btn-active' : ''}`}
                  onClick={() => updateSettings({ currency: c.code })}
                >
                  <span className="currency-symbol">{c.symbol}</span>
                  <span className="currency-label">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="glass-card settings-section animate-fade-in">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(10,132,255,0.2)', color: 'var(--blue)' }}>✦</div>
            <div>
              <div className="settings-section-title">AI Assistant</div>
              <div className="settings-section-sub">Configure AI provider (also in AI panel ⚙)</div>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="form-group">
              <label className="form-label">AI Provider</label>
              <div className="type-toggle" style={{ marginBottom: 12 }}>
                <button className={`type-btn ${settings.aiProvider === 'claude' ? 'type-btn-income' : ''}`} type="button" onClick={() => updateSettings({ aiProvider: 'claude' })}>
                  Claude (Anthropic)
                </button>
                <button className={`type-btn ${settings.aiProvider === 'gemini' ? 'type-btn-income' : ''}`} type="button" onClick={() => updateSettings({ aiProvider: 'gemini' })}>
                  Gemini (Free)
                </button>
              </div>
            </div>
            {settings.aiProvider === 'claude' && (
              <div className="form-group">
                <label className="form-label">Anthropic API Key</label>
                <input className="glass-input" type="password" placeholder="sk-ant-api..." value={settings.claudeKey || ''} onChange={(e) => updateSettings({ claudeKey: e.target.value })} style={{ fontSize: 13 }} />
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)' }}>Get key at console.anthropic.com</a>
                </div>
              </div>
            )}
            {settings.aiProvider === 'gemini' && (
              <div className="form-group">
                <label className="form-label">Gemini API Key</label>
                <input className="glass-input" type="password" placeholder="AIza..." value={settings.geminiKey || ''} onChange={(e) => updateSettings({ geminiKey: e.target.value })} style={{ fontSize: 13 }} />
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  Free key — no card needed ·{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)' }}>aistudio.google.com/app/apikey</a>
                </div>
              </div>
            )}
            <button className="glass-button" style={{ fontSize: 13 }} onClick={clearAiMessages}>Clear Chat History</button>
          </div>
        </div>

        {/* Categories - Income */}
        <div className="glass-card settings-section animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(52,199,89,0.2)', color: 'var(--green)' }}>↑</div>
            <div>
              <div className="settings-section-title">Income Categories</div>
              <div className="settings-section-sub">{categories.income.length} categories</div>
            </div>
            <button className="glass-button glass-button-green" style={{ marginLeft: 'auto', padding: '7px 14px', fontSize: 13 }} onClick={() => setAddCatType('income')}>
              + Add
            </button>
          </div>
          <div className="settings-section-body">
            <div className="cat-list">
              {categories.income.map((cat) => (
                <div key={cat.id} className="cat-list-item">
                  <div className="cat-list-icon" style={{ background: cat.color + '22', border: `1px solid ${cat.color}33` }}>{cat.icon}</div>
                  <span className="cat-list-name">{cat.name}</span>
                  <div className="cat-list-dot" style={{ background: cat.color }} />
                  <button className="glass-icon-btn" style={{ fontSize: 11, marginLeft: 'auto' }} onClick={() => handleDeleteCat('income', cat)} title="Delete">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories - Expense */}
        <div className="glass-card settings-section animate-fade-in" style={{ animationDelay: '0.10s' }}>
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(255,69,58,0.2)', color: 'var(--red)' }}>↓</div>
            <div>
              <div className="settings-section-title">Expense Categories</div>
              <div className="settings-section-sub">{categories.expense.length} categories</div>
            </div>
            <button className="glass-button glass-button-red" style={{ marginLeft: 'auto', padding: '7px 14px', fontSize: 13 }} onClick={() => setAddCatType('expense')}>
              + Add
            </button>
          </div>
          <div className="settings-section-body">
            <div className="cat-list">
              {categories.expense.map((cat) => (
                <div key={cat.id} className="cat-list-item">
                  <div className="cat-list-icon" style={{ background: cat.color + '22', border: `1px solid ${cat.color}33` }}>{cat.icon}</div>
                  <span className="cat-list-name">{cat.name}</span>
                  <div className="cat-list-dot" style={{ background: cat.color }} />
                  <button className="glass-icon-btn" style={{ fontSize: 11, marginLeft: 'auto' }} onClick={() => handleDeleteCat('expense', cat)} title="Delete">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="glass-card settings-section animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(191,90,242,0.2)', color: 'var(--purple)' }}>◈</div>
            <div>
              <div className="settings-section-title">Data Management</div>
              <div className="settings-section-sub">Export, backup & manage your data</div>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="data-stats">
              <div className="data-stat-item">
                <span className="data-stat-val">{transactions.length}</span>
                <span className="data-stat-label">Transactions</span>
              </div>
              <div className="data-stat-item">
                <span className="data-stat-val">{books.length}</span>
                <span className="data-stat-label">Books</span>
              </div>
              <div className="data-stat-item">
                <span className="data-stat-val">{categories.income.length + categories.expense.length}</span>
                <span className="data-stat-label">Categories</span>
              </div>
            </div>
            <div className="divider" style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="glass-button" style={{ justifyContent: 'flex-start', borderRadius: 'var(--radius-md)' }} onClick={exportData}>
                <span>📥</span> Export All Data (JSON)
              </button>
              <button
                className="glass-button"
                style={{ justifyContent: 'flex-start', borderRadius: 'var(--radius-md)', borderColor: 'rgba(255,69,58,0.3)', color: 'var(--red)' }}
                onClick={clearAllData}
              >
                <span>🗑</span> Clear All Data
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="glass-card settings-section animate-fade-in" style={{ animationDelay: '0.20s' }}>
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(10,132,255,0.2)', color: 'var(--blue)' }}>ℹ</div>
            <div>
              <div className="settings-section-title">About CashBook</div>
              <div className="settings-section-sub">Version 2.0 · Private Use</div>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="about-features">
              {[
                { icon: '💎', label: 'Apple Liquid Glass UI', desc: 'Frosted glass design inspired by Apple Vision Pro' },
                { icon: '✦', label: 'AI-Powered Insights', desc: 'Claude & Gemini AI analyze your spending patterns' },
                { icon: '📊', label: 'Budget Tracking', desc: 'Monthly limits with color-coded progress bars' },
                { icon: '🎯', label: 'Savings Goals', desc: 'Track progress toward your financial targets' },
                { icon: '📒', label: 'Multiple Books', desc: 'Organize finances across separate ledgers' },
                { icon: '🔒', label: 'Private & Secure', desc: 'All data stored locally in your browser' },
              ].map((f) => (
                <div key={f.label} className="about-feature-item">
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {addCatType && <AddCategoryModal type={addCatType} onClose={() => setAddCatType(null)} />}
    </div>
  );
}
