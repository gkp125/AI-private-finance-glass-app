import { useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, getCurrentMonth } from '../utils/format';
import './Budgets.css';

function BudgetBar({ spent, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--orange)' : 'var(--green)';
  return (
    <div className="budget-bar-wrap">
      <div className="budget-bar-track">
        <div className="budget-bar-fill" style={{ width: pct + '%', background: color }} />
      </div>
      <span className="budget-bar-pct" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function Budgets() {
  const { categories, budgets, upsertBudget, deleteBudget, getBudgetSpent, settings } = useStore();
  const [month, setMonth] = useState(getCurrentMonth());
  const [editId, setEditId] = useState(null);
  const [editLimit, setEditLimit] = useState('');
  const [addCat, setAddCat] = useState('');
  const [addLimit, setAddLimit] = useState('');
  const cur = settings.currency || 'INR';

  const monthBudgets = budgets.filter((b) => b.month === month);

  const handleSave = (catId, limit) => {
    if (!limit || isNaN(limit)) return;
    upsertBudget({ categoryId: catId, month, limit: parseFloat(limit) });
    setEditId(null);
    setEditLimit('');
  };

  const handleAdd = () => {
    if (!addCat || !addLimit) return;
    upsertBudget({ categoryId: addCat, month, limit: parseFloat(addLimit) });
    setAddCat('');
    setAddLimit('');
  };

  const budgetedCatIds = new Set(monthBudgets.map((b) => b.categoryId));
  const availableCats = categories.expense.filter((c) => !budgetedCatIds.has(c.id));

  const totalBudget = monthBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + getBudgetSpent(b.categoryId, month), 0);

  return (
    <div className="budgets-page">
      <div className="budgets-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Monthly spending limits</p>
        </div>
        <input
          type="month"
          className="glass-input"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ width: 160 }}
        />
      </div>

      {/* Summary */}
      <div className="budgets-summary glass-card">
        <div className="budget-sum-item">
          <div className="budget-sum-label">Total Budget</div>
          <div className="budget-sum-val">{formatCurrency(totalBudget, false, cur)}</div>
        </div>
        <div className="budget-sum-item">
          <div className="budget-sum-label">Total Spent</div>
          <div className="budget-sum-val text-red">{formatCurrency(totalSpent, false, cur)}</div>
        </div>
        <div className="budget-sum-item">
          <div className="budget-sum-label">Remaining</div>
          <div className={`budget-sum-val ${totalBudget - totalSpent >= 0 ? 'text-green' : 'text-red'}`}>
            {formatCurrency(totalBudget - totalSpent, false, cur)}
          </div>
        </div>
      </div>

      {/* Budget List */}
      <div className="budgets-list">
        {monthBudgets.length === 0 && (
          <div className="empty-state glass-card-flat">
            <div className="empty-icon">📊</div>
            <div className="empty-title">No budgets set</div>
            <div className="empty-sub">Add a category budget below to start tracking</div>
          </div>
        )}
        {monthBudgets.map((b) => {
          const cat = categories.expense.find((c) => c.id === b.categoryId);
          if (!cat) return null;
          const spent = getBudgetSpent(b.categoryId, month);
          const isEditing = editId === b.id;
          return (
            <div key={b.id} className="budget-item glass-card">
              <div className="budget-item-top">
                <div className="budget-cat-icon" style={{ background: cat.color + '22', border: `1px solid ${cat.color}44` }}>
                  {cat.icon}
                </div>
                <div className="budget-cat-info">
                  <div className="budget-cat-name">{cat.name}</div>
                  <BudgetBar spent={spent} limit={b.limit} />
                </div>
                <div className="budget-amounts">
                  {isEditing ? (
                    <div className="budget-edit-row">
                      <input
                        className="glass-input"
                        type="number"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        style={{ width: 100, padding: '5px 10px', fontSize: 13 }}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave(b.categoryId, editLimit)}
                      />
                      <button className="glass-button glass-button-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleSave(b.categoryId, editLimit)}>✓</button>
                      <button className="glass-button" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditId(null)}>✕</button>
                    </div>
                  ) : (
                    <>
                      <div className="budget-spent-val">
                        <span className="text-red">{formatCurrency(spent, true, cur)}</span>
                        <span style={{ color: 'var(--text-quaternary)' }}> / </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(b.limit, true, cur)}</span>
                      </div>
                      <div className="budget-item-actions">
                        <button className="glass-icon-btn" style={{ fontSize: 12 }} onClick={() => { setEditId(b.id); setEditLimit(b.limit); }} title="Edit">✎</button>
                        <button className="glass-icon-btn" style={{ fontSize: 12 }} onClick={() => deleteBudget(b.id)} title="Delete">✕</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Budget */}
      {availableCats.length > 0 && (
        <div className="add-budget-section glass-card">
          <div className="add-budget-title">Add Category Budget</div>
          <div className="add-budget-row">
            <div className="select-wrapper" style={{ flex: 1 }}>
              <select className="glass-select" value={addCat} onChange={(e) => setAddCat(e.target.value)}>
                <option value="">Select category...</option>
                {availableCats.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <span className="select-arrow">⌄</span>
            </div>
            <input
              className="glass-input"
              type="number"
              placeholder="Limit amount"
              value={addLimit}
              onChange={(e) => setAddLimit(e.target.value)}
              style={{ width: 140 }}
            />
            <button
              className="glass-button glass-button-primary"
              onClick={handleAdd}
              disabled={!addCat || !addLimit}
            >
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
