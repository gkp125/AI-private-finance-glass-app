import { useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/format';
import './Books.css';

const BOOK_ICONS = ['👤', '🏢', '🏠', '🚀', '💼', '🎯', '📱', '🌍', '🎨', '💡', '🏋️', '🎓'];
const BOOK_COLORS = ['#0A84FF', '#34C759', '#FF9F0A', '#BF5AF2', '#FF453A', '#5E5CE6', '#FF375F', '#32ADE6', '#30B0C7', '#64D2FF'];

function AddBookModal({ onClose }) {
  const { addBook } = useStore();
  const [form, setForm] = useState({ name: '', icon: '📒', color: '#0A84FF', description: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    addBook(form);
    onClose();
  };

  return (
    <div className="glass-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-modal animate-scale-in">
        <div className="modal-header">
          <div className="modal-title">Create New Book</div>
          <button className="glass-icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Book Name</label>
            <input
              className="glass-input"
              placeholder="e.g., Personal, Travel, Business"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input
              className="glass-input"
              placeholder="What is this book for?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pick Icon</label>
            <div className="icon-grid">
              {BOOK_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-btn ${form.icon === icon ? 'icon-btn-active' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-grid">
              {BOOK_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-btn ${form.color === color ? 'color-btn-active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="book-preview" style={{ borderColor: form.color + '44', background: form.color + '11' }}>
            <div className="book-preview-icon" style={{ background: form.color + '33', border: `1px solid ${form.color}55` }}>
              {form.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{form.name || 'Book Name'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{form.description || 'No description'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="glass-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-button glass-button-primary" disabled={!form.name}>
              Create Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Books() {
  const { books, deleteBook, setActiveBook, setActiveView, getBalance, getTotalIncome, getTotalExpense, transactions } = useStore();
  const [showModal, setShowModal] = useState(false);

  const openBook = (id) => {
    setActiveBook(id);
    setActiveView('transactions');
  };

  return (
    <div className="books-page">
      <div className="books-header">
        <div>
          <h1 className="page-title">Books</h1>
          <p className="page-subtitle">Organize your finances across {books.length} books</p>
        </div>
        <button className="glass-button glass-button-primary" onClick={() => setShowModal(true)}>
          + New Book
        </button>
      </div>

      <div className="books-grid stagger">
        {books.map((book) => {
          const bal = getBalance(book.id);
          const inc = getTotalIncome(book.id);
          const exp = getTotalExpense(book.id);
          const txnCount = transactions.filter((t) => t.bookId === book.id).length;
          const savRate = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;
          const pct = inc > 0 ? Math.min(100, Math.round((exp / inc) * 100)) : 0;

          return (
            <div
              key={book.id}
              className="book-card glass-card animate-fade-in"
              style={{ '--book-color': book.color }}
            >
              {/* Top accent */}
              <div className="book-card-accent" style={{ background: `linear-gradient(135deg, ${book.color}40, ${book.color}15)` }} />

              <div className="book-card-header">
                <div className="book-card-icon" style={{ background: book.color + '25', border: `1px solid ${book.color}44` }}>
                  {book.icon}
                </div>
                <div className="book-card-info">
                  <div className="book-card-name">{book.name}</div>
                  {book.description && <div className="book-card-desc">{book.description}</div>}
                </div>
                <div className="book-card-actions">
                  <span className="badge badge-blue">{txnCount} txns</span>
                </div>
              </div>

              <div className={`book-card-balance ${bal >= 0 ? 'text-green' : 'text-red'}`}>
                {formatCurrency(bal)}
              </div>

              <div className="book-card-stats">
                <div className="book-stat">
                  <span className="book-stat-label">Income</span>
                  <span className="book-stat-val text-green">{formatCurrency(inc, true)}</span>
                </div>
                <div className="book-stat">
                  <span className="book-stat-label">Expense</span>
                  <span className="book-stat-val text-red">{formatCurrency(exp, true)}</span>
                </div>
                <div className="book-stat">
                  <span className="book-stat-label">Saved</span>
                  <span className="book-stat-val" style={{ color: savRate >= 0 ? 'var(--green)' : 'var(--red)' }}>{savRate}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="book-card-progress">
                <div className="book-progress-track" style={{ height: 6 }}>
                  <div
                    className="book-progress-fill"
                    style={{ width: pct + '%', background: `linear-gradient(90deg, ${book.color}, ${book.color}88)` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Spent {pct}% of income</span>
                </div>
              </div>

              <div className="book-card-footer">
                <button className="glass-button" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }} onClick={() => openBook(book.id)}>
                  View Transactions
                </button>
                {book.id !== 'personal' && book.id !== 'business' && book.id !== 'home' && (
                  <button
                    className="glass-icon-btn"
                    onClick={() => {
                      if (window.confirm(`Delete "${book.name}"? All transactions will be removed.`)) {
                        deleteBook(book.id);
                      }
                    }}
                    style={{ color: 'var(--red)' }}
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Book Card */}
        <div className="add-book-card glass-card" onClick={() => setShowModal(true)}>
          <div className="add-book-icon">+</div>
          <div className="add-book-text">Create New Book</div>
          <div className="add-book-sub">Track a new category of finances</div>
        </div>
      </div>

      {showModal && <AddBookModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
