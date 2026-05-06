import { useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/format';
import './Goals.css';

const EMOJI_OPTIONS = ['🛡️','💻','🏠','✈️','🎓','🚗','💍','📱','🏖️','🎯','💰','🌍','🏋️','🎸','⛵'];

function ProgressRing({ pct, color, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

function AddGoalModal({ onClose }) {
  const { addGoal } = useStore();
  const [form, setForm] = useState({ name: '', target: '', targetDate: '', icon: '🎯', color: '#0A84FF' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.target) return;
    addGoal({ ...form, target: parseFloat(form.target) });
    onClose();
  };

  return (
    <div className="glass-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-modal animate-scale-in" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div className="modal-title">New Savings Goal</div>
          <button className="glass-icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Goal Name</label>
            <input className="glass-input" type="text" placeholder="e.g. Emergency Fund" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target Amount</label>
              <input className="glass-input" type="number" placeholder="0" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} required min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Target Date</label>
              <input className="glass-input" type="date" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="emoji-grid">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} type="button" className={`emoji-btn ${form.icon === e ? 'emoji-btn-active' : ''}`} onClick={() => setForm((f) => ({ ...f, icon: e }))}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-row">
              {['#0A84FF','#34C759','#FF9F0A','#BF5AF2','#FF453A','#32ADE6','#5E5CE6'].map((c) => (
                <button key={c} type="button" className={`color-dot-btn ${form.color === c ? 'color-dot-active' : ''}`} style={{ background: c }} onClick={() => setForm((f) => ({ ...f, color: c }))} />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="glass-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-button glass-button-primary" disabled={!form.name || !form.target}>
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContributeModal({ goal, onClose }) {
  const { contributeToGoal, settings } = useStore();
  const [amount, setAmount] = useState('');
  const cur = settings.currency || 'INR';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;
    contributeToGoal(goal.id, parseFloat(amount));
    onClose();
  };

  return (
    <div className="glass-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-modal animate-scale-in" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <div className="modal-title">{goal.icon} Add to {goal.name}</div>
          <button className="glass-icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Contribution Amount</label>
            <input
              className="glass-input amount-input"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              autoFocus
            />
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
              Remaining: {formatCurrency(goal.target - goal.saved, false, cur)}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="glass-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-button glass-button-primary" disabled={!amount}>
              Add Contribution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Goals() {
  const { goals, deleteGoal, settings } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [contributeGoal, setContributeGoal] = useState(null);
  const cur = settings.currency || 'INR';

  const daysLeft = (targetDate) => {
    if (!targetDate) return null;
    const diff = new Date(targetDate + 'T00:00:00') - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="goals-page">
      <div className="goals-header">
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle">Track your financial targets</p>
        </div>
        <button className="glass-button glass-button-primary" onClick={() => setShowAdd(true)}>
          + New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state glass-card-flat">
          <div className="empty-icon">🎯</div>
          <div className="empty-title">No goals yet</div>
          <div className="empty-sub">Create a savings goal to track your progress</div>
          <button className="glass-button glass-button-primary" onClick={() => setShowAdd(true)}>
            + New Goal
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => {
            const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
            const days = daysLeft(goal.targetDate);
            return (
              <div key={goal.id} className="goal-card glass-card">
                <div className="goal-card-top">
                  <div className="goal-ring-wrap">
                    <ProgressRing pct={pct} color={goal.color} size={80} />
                    <div className="goal-ring-center">
                      <div className="goal-ring-icon">{goal.icon}</div>
                      <div className="goal-ring-pct" style={{ color: goal.color }}>{pct}%</div>
                    </div>
                  </div>
                  <div className="goal-info">
                    <div className="goal-name">{goal.name}</div>
                    <div className="goal-amounts">
                      <span style={{ color: goal.color, fontWeight: 700 }}>{formatCurrency(goal.saved, true, cur)}</span>
                      <span style={{ color: 'var(--text-quaternary)' }}> / </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(goal.target, true, cur)}</span>
                    </div>
                    {goal.targetDate && (
                      <div className="goal-date">
                        {days !== null && <span style={{ color: days <= 30 ? 'var(--orange)' : 'var(--text-tertiary)' }}>⏱ {days} days left</span>}
                        <span style={{ color: 'var(--text-quaternary)', marginLeft: 6 }}>{formatDate(goal.targetDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="goal-bar-track">
                  <div className="goal-bar-fill" style={{ width: pct + '%', background: goal.color }} />
                </div>

                <div className="goal-actions">
                  <button className="glass-button glass-button-primary" style={{ flex: 1, fontSize: 13 }} onClick={() => setContributeGoal(goal)}>
                    + Contribute
                  </button>
                  <button className="glass-icon-btn" onClick={() => deleteGoal(goal.id)} title="Delete goal">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} />}
      {contributeGoal && <ContributeModal goal={contributeGoal} onClose={() => setContributeGoal(null)} />}
    </div>
  );
}
