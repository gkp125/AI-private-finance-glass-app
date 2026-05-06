import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/format';
import './Sidebar.css';

const navItems = [
  { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
  { id: 'transactions', icon: '↕', label: 'Transactions' },
  { id: 'budgets', icon: '📊', label: 'Budgets' },
  { id: 'goals', icon: '🎯', label: 'Goals' },
  { id: 'books', icon: '📒', label: 'Books' },
  { id: 'reports', icon: '📈', label: 'Reports' },
  { id: 'settings', icon: '⚙', label: 'Settings' },
];

export default function Sidebar() {
  const { activeView, setActiveView, books, activeBook, setActiveBook, getBalance, toggleAiChat, aiChatOpen, transactions, theme, setTheme, settings } = useStore();
  const cur = settings?.currency || 'INR';
  const totalBalance = getBalance('all');
  const isPositive = totalBalance >= 0;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <span className="brand-icon">◈</span>
        </div>
        <div className="brand-text">
          <span className="brand-name">CashBook</span>
          <span className="brand-tagline">Smart Finance</span>
        </div>
        <button
          className="glass-icon-btn theme-toggle"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>

      {/* Balance Card */}
      <div className="sidebar-balance glass-card-flat">
        <div className="balance-label">Net Balance</div>
        <div className={`balance-amount ${isPositive ? 'text-green' : 'text-red'}`}>
          {formatCurrency(totalBalance, false, cur)}
        </div>
        <div className="balance-sub">
          <span className="text-green">↑ {formatCurrency(useStore.getState().getTotalIncome('all'), true, cur)}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span className="text-red">↓ {formatCurrency(useStore.getState().getTotalExpense('all'), true, cur)}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'nav-item-active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.id === 'transactions' && transactions.length > 0 && (
              <span className="nav-badge">{transactions.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Books */}
      <div className="sidebar-books">
        <div className="nav-section-label">Books</div>
        <button
          className={`book-item ${activeBook === 'all' ? 'book-item-active' : ''}`}
          onClick={() => { setActiveBook('all'); setActiveView('transactions'); }}
        >
          <span className="book-icon">📚</span>
          <span className="book-name">All Books</span>
        </button>
        {books.map((book) => (
          <button
            key={book.id}
            className={`book-item ${activeBook === book.id ? 'book-item-active' : ''}`}
            onClick={() => { setActiveBook(book.id); setActiveView('transactions'); }}
          >
            <span className="book-icon">{book.icon}</span>
            <span className="book-name">{book.name}</span>
            <span className="book-balance" style={{ color: getBalance(book.id) >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {formatCurrency(getBalance(book.id), true, cur)}
            </span>
          </button>
        ))}
      </div>

      {/* AI Button */}
      <button
        className={`ai-fab-sidebar ${aiChatOpen ? 'ai-fab-active' : ''}`}
        onClick={toggleAiChat}
      >
        <span className="ai-fab-icon">✦</span>
        <span className="ai-fab-text">AI Assistant</span>
        <span className="ai-pulse-ring" />
      </button>
    </aside>
  );
}
