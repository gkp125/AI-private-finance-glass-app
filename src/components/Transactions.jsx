import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/format';
import './Transactions.css';

function AddTransactionModal({ onClose, defaultType = 'expense' }) {
  const { addTransaction, books, categories, activeBook } = useStore();
  const [form, setForm] = useState({
    type: defaultType,
    amount: '',
    category: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
    bookId: activeBook !== 'all' ? activeBook : books[0]?.id || 'personal',
  });

  const catList = form.type === 'income' ? categories.income : categories.expense;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.category) return;
    addTransaction({ ...form, amount: parseFloat(form.amount) });
    onClose();
  };

  return (
    <div className="glass-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-modal animate-scale-in" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title">Add Transaction</div>
          <button className="glass-icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Type Toggle */}
        <div className="type-toggle">
          <button
            className={`type-btn ${form.type === 'income' ? 'type-btn-income' : ''}`}
            onClick={() => setForm((f) => ({ ...f, type: 'income', category: '' }))}
            type="button"
          >
            ↑ Cash In
          </button>
          <button
            className={`type-btn ${form.type === 'expense' ? 'type-btn-expense' : ''}`}
            onClick={() => setForm((f) => ({ ...f, type: 'expense', category: '' }))}
            type="button"
          >
            ↓ Cash Out
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              className="glass-input amount-input"
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
              min="0"
              step="0.01"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="cat-grid">
              {catList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`cat-btn ${form.category === cat.id ? 'cat-btn-active' : ''}`}
                  style={{ '--cat-color': cat.color }}
                  onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
                >
                  <span className="cat-btn-icon">{cat.icon}</span>
                  <span className="cat-btn-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Note</label>
              <input
                className="glass-input"
                type="text"
                placeholder="Add a note..."
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                className="glass-input"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Book</label>
            <div className="select-wrapper">
              <select
                className="glass-select"
                value={form.bookId}
                onChange={(e) => setForm((f) => ({ ...f, bookId: e.target.value }))}
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                ))}
              </select>
              <span className="select-arrow">⌄</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="glass-button" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className={`glass-button ${form.type === 'income' ? 'glass-button-green' : 'glass-button-red'}`}
              disabled={!form.amount || !form.category}
            >
              {form.type === 'income' ? '↑ Add Income' : '↓ Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { transactions, categories, books, activeBook, setActiveBook, deleteTransaction, getBalance, getTotalIncome, getTotalExpense } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [defaultType, setDefaultType] = useState('expense');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filtered = useMemo(() => {
    let txns = activeBook === 'all' ? transactions : transactions.filter((t) => t.bookId === activeBook);

    if (search) {
      const q = search.toLowerCase();
      txns = txns.filter((t) => t.note?.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }

    if (filterType !== 'all') txns = txns.filter((t) => t.type === filterType);
    if (filterCat !== 'all') txns = txns.filter((t) => t.category === filterCat);

    return [...txns].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'amount') return b.amount - a.amount;
      return 0;
    });
  }, [transactions, activeBook, search, filterType, filterCat, sortBy]);

  const getCatInfo = (catId, type) => {
    const list = type === 'income' ? categories.income : categories.expense;
    return list.find((c) => c.id === catId) || { name: catId, icon: '📦', color: '#8E8E93' };
  };

  const getBookName = (bookId) => {
    const b = books.find((b) => b.id === bookId);
    return b ? `${b.icon} ${b.name}` : bookId;
  };

  const bal = getBalance(activeBook);
  const inc = getTotalIncome(activeBook);
  const exp = getTotalExpense(activeBook);

  const openAdd = (type) => { setDefaultType(type); setShowModal(true); };

  // Group by date
  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((t) => {
      if (!g[t.date]) g[t.date] = [];
      g[t.date].push(t);
    });
    return Object.entries(g).sort(([a], [b]) => new Date(b) - new Date(a));
  }, [filtered]);

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">
            {activeBook === 'all' ? 'All Books' : getBookName(activeBook)} · {filtered.length} entries
          </p>
        </div>
        <div className="txn-header-btns">
          <button className="glass-button glass-button-green" onClick={() => openAdd('income')}>
            + Cash In
          </button>
          <button className="glass-button glass-button-red" onClick={() => openAdd('expense')}>
            − Cash Out
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="txn-summary">
        <div className="txn-sum-item">
          <span className="txn-sum-label">Balance</span>
          <span className={`txn-sum-val ${bal >= 0 ? 'text-green' : 'text-red'}`}>{formatCurrency(bal)}</span>
        </div>
        <div className="txn-sum-divider" />
        <div className="txn-sum-item">
          <span className="txn-sum-label">Income</span>
          <span className="txn-sum-val text-green">{formatCurrency(inc)}</span>
        </div>
        <div className="txn-sum-divider" />
        <div className="txn-sum-item">
          <span className="txn-sum-label">Expense</span>
          <span className="txn-sum-val text-red">{formatCurrency(exp)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="txn-filters glass-card-flat">
        <div className="filter-search-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="filter-search"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {['all', 'income', 'expense'].map((t) => (
            <button
              key={t}
              className={`filter-chip ${filterType === t ? 'filter-chip-active' : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t === 'all' ? 'All' : t === 'income' ? '↑ In' : '↓ Out'}
            </button>
          ))}
        </div>
        <div className="select-wrapper" style={{ minWidth: 130 }}>
          <select className="glass-select" style={{ padding: '8px 14px', fontSize: 13 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Newest first</option>
            <option value="amount">Highest amount</option>
          </select>
          <span className="select-arrow">⌄</span>
        </div>
      </div>

      {/* Book Tabs */}
      <div className="book-tabs">
        <button className={`book-tab ${activeBook === 'all' ? 'book-tab-active' : ''}`} onClick={() => setActiveBook('all')}>
          📚 All
        </button>
        {books.map((b) => (
          <button key={b.id} className={`book-tab ${activeBook === b.id ? 'book-tab-active' : ''}`} onClick={() => setActiveBook(b.id)} style={{ '--tab-color': b.color }}>
            {b.icon} {b.name}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="txn-list">
        {grouped.length === 0 ? (
          <div className="empty-state glass-card-flat">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No transactions</div>
            <div className="empty-sub">Add your first transaction to get started</div>
            <button className="glass-button glass-button-primary" onClick={() => openAdd('expense')}>
              + Add Transaction
            </button>
          </div>
        ) : (
          grouped.map(([date, txns]) => (
            <div key={date} className="txn-date-group">
              <div className="txn-date-header">
                <span className="txn-date-label">{formatDate(date)}</span>
                <span className="txn-date-net" style={{
                  color: txns.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0) >= 0 ? 'var(--green)' : 'var(--red)'
                }}>
                  {formatCurrency(txns.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0))}
                </span>
              </div>
              {txns.map((txn, i) => {
                const cat = getCatInfo(txn.category, txn.type);
                return (
                  <div key={txn.id} className="txn-item glass-card animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="txn-cat-icon" style={{ background: cat.color + '22', border: `1px solid ${cat.color}33` }}>
                      {cat.icon}
                    </div>
                    <div className="txn-details">
                      <div className="txn-note">{txn.note || cat.name}</div>
                      <div className="txn-meta">
                        <span className="badge" style={{ background: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}33`, fontSize: 11 }}>
                          {cat.name}
                        </span>
                        <span className="txn-book">{getBookName(txn.bookId)}</span>
                      </div>
                    </div>
                    <div className="txn-right">
                      <div className={`txn-amount ${txn.type === 'income' ? 'text-green' : 'text-red'}`}>
                        {txn.type === 'income' ? '+' : '−'}{formatCurrency(txn.amount)}
                      </div>
                      <button
                        className="txn-delete-btn"
                        onClick={() => deleteTransaction(txn.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} defaultType={defaultType} />}
    </div>
  );
}
