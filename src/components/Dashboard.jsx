import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, getMonthlyTrend, getSpendingByCategory } from '../utils/format';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import './Dashboard.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="chart-tooltip-row">
          <span style={{ color: p.color }}>{p.name === 'income' ? '↑ Income' : p.name === 'expense' ? '↓ Expense' : '◎ Net'}</span>
          <span style={{ color: p.color, fontWeight: 700 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{payload[0].payload.icon}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{payload[0].name}</span>
      </div>
      <div style={{ color: payload[0].payload.color, fontWeight: 700, fontSize: 15 }}>
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { transactions, categories, books, getBalance, getTotalIncome, getTotalExpense, toggleAiChat, setAiAnalysisCache } = useStore();
  const [trendPeriod, setTrendPeriod] = useState(6);

  const balance = getBalance('all');
  const income = getTotalIncome('all');
  const expense = getTotalExpense('all');
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  const trend = useMemo(() => getMonthlyTrend(transactions, trendPeriod), [transactions, trendPeriod]);
  const spending = useMemo(() => getSpendingByCategory(transactions, categories).slice(0, 6), [transactions, categories]);

  // Recent transactions
  const recent = useMemo(() => [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5), [transactions]);

  const getCatInfo = (catId, type) => {
    const list = type === 'income' ? categories.income : categories.expense;
    return list.find((c) => c.id === catId) || { name: catId, icon: '📦', color: '#8E8E93' };
  };

  const handleAiInsight = () => {
    const summary = {
      balance: formatCurrency(balance),
      income: formatCurrency(income),
      expense: formatCurrency(expense),
      savingsRate: savingsRate + '%',
      topSpending: spending.slice(0, 3).map((s) => `${s.name}: ${formatCurrency(s.total)}`).join(', '),
    };
    useStore.getState().setAiAnalysisCache(summary);
    toggleAiChat();
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your financial overview — March 2026</p>
        </div>
        <button className="glass-button glass-button-primary" onClick={handleAiInsight}>
          <span style={{ fontSize: 16 }}>✦</span>
          AI Insights
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid stagger">
        <StatCard
          label="Net Balance"
          value={formatCurrency(balance)}
          valueColor={balance >= 0 ? 'var(--green)' : 'var(--red)'}
          icon="◈"
          iconBg="rgba(10, 132, 255, 0.2)"
          iconColor="var(--blue)"
          sub={balance >= 0 ? 'Looking healthy!' : 'Over budget'}
          subColor={balance >= 0 ? 'var(--green)' : 'var(--red)'}
          glow="rgba(10, 132, 255, 0.15)"
        />
        <StatCard
          label="Total Income"
          value={formatCurrency(income)}
          valueColor="var(--green)"
          icon="↑"
          iconBg="rgba(52, 199, 89, 0.2)"
          iconColor="var(--green)"
          sub={`${transactions.filter(t => t.type === 'income').length} transactions`}
          glow="rgba(52, 199, 89, 0.12)"
        />
        <StatCard
          label="Total Expense"
          value={formatCurrency(expense)}
          valueColor="var(--red)"
          icon="↓"
          iconBg="rgba(255, 69, 58, 0.2)"
          iconColor="var(--red)"
          sub={`${transactions.filter(t => t.type === 'expense').length} transactions`}
          glow="rgba(255, 69, 58, 0.12)"
        />
        <StatCard
          label="Savings Rate"
          value={`${savingsRate}%`}
          valueColor={savingsRate >= 20 ? 'var(--green)' : savingsRate >= 10 ? 'var(--orange)' : 'var(--red)'}
          icon="◎"
          iconBg="rgba(191, 90, 242, 0.2)"
          iconColor="var(--purple)"
          sub={savingsRate >= 20 ? 'Excellent!' : savingsRate >= 10 ? 'Good job' : 'Needs work'}
          glow="rgba(191, 90, 242, 0.12)"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Trend Chart */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Income vs Expense</div>
              <div className="chart-sub">Trend over time</div>
            </div>
            <div className="period-tabs">
              {[3, 6].map((p) => (
                <button
                  key={p}
                  className={`period-tab ${trendPeriod === p ? 'period-tab-active' : ''}`}
                  onClick={() => setTrendPeriod(p)}
                >
                  {p}M
                </button>
              ))}
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34C759" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF453A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF453A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => '₹' + (v / 1000) + 'K'} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" name="income" stroke="#34C759" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
                <Area type="monotone" dataKey="expense" name="expense" stroke="#FF453A" strokeWidth={2} fill="url(#expenseGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Pie */}
        <div className="glass-card chart-card chart-card-sm">
          <div className="chart-header">
            <div>
              <div className="chart-title">Spending</div>
              <div className="chart-sub">By category</div>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={spending}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="name"
                >
                  {spending.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: 'rgba(14,14,22,0.95)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pie-legend">
            {spending.map((s) => (
              <div key={s.id} className="pie-legend-item">
                <span className="pie-dot" style={{ background: s.color }} />
                <span className="pie-name">{s.icon} {s.name}</span>
                <span className="pie-value" style={{ color: s.color }}>{formatCurrency(s.total, true)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        {/* Recent Transactions */}
        <div className="glass-card recent-card">
          <div className="section-header">
            <div className="chart-title">Recent Transactions</div>
            <button className="glass-button" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => useStore.getState().setActiveView('transactions')}>
              View all
            </button>
          </div>
          <div className="recent-list">
            {recent.map((txn, i) => {
              const cat = getCatInfo(txn.category, txn.type);
              return (
                <div key={txn.id} className="recent-item animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="recent-icon" style={{ background: cat.color + '22', border: `1px solid ${cat.color}44` }}>
                    {cat.icon}
                  </div>
                  <div className="recent-info">
                    <div className="recent-note">{txn.note || cat.name}</div>
                    <div className="recent-meta">
                      <span className="recent-cat" style={{ color: cat.color }}>{cat.name}</span>
                      <span style={{ color: 'var(--text-quaternary)' }}>·</span>
                      <span className="recent-date">{txn.date}</span>
                    </div>
                  </div>
                  <div className={`recent-amount ${txn.type === 'income' ? 'text-green' : 'text-red'}`}>
                    {txn.type === 'income' ? '+' : '−'}{formatCurrency(txn.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Books Overview */}
        <div className="glass-card books-overview-card">
          <div className="section-header">
            <div className="chart-title">Books</div>
            <button className="glass-button" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => useStore.getState().setActiveView('books')}>
              Manage
            </button>
          </div>
          <div className="books-list">
            {books.map((book) => {
              const bal = useStore.getState().getBalance(book.id);
              const inc = useStore.getState().getTotalIncome(book.id);
              const exp = useStore.getState().getTotalExpense(book.id);
              const pct = inc > 0 ? Math.min(100, Math.round((exp / inc) * 100)) : 0;
              return (
                <div key={book.id} className="book-overview-item">
                  <div className="book-icon-lg" style={{ background: book.color + '22', border: `1px solid ${book.color}44` }}>
                    {book.icon}
                  </div>
                  <div className="book-overview-info">
                    <div className="book-overview-name">{book.name}</div>
                    <div className="book-progress-bar">
                      <div className="book-progress-track">
                        <div className="book-progress-fill" style={{ width: pct + '%', background: book.color }} />
                      </div>
                      <span className="book-progress-pct" style={{ color: book.color }}>{pct}%</span>
                    </div>
                  </div>
                  <div className={`book-overview-bal ${bal >= 0 ? 'text-green' : 'text-red'}`}>
                    {formatCurrency(bal, true)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, valueColor, icon, iconBg, iconColor, sub, subColor, glow }) {
  return (
    <div className="stat-card glass-card animate-fade-in" style={{ '--card-glow': glow || 'transparent' }}>
      <div className="stat-card-top">
        <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-value" style={{ color: valueColor }}>{value}</div>
      {sub && <div className="stat-sub" style={{ color: subColor || 'var(--text-tertiary)' }}>{sub}</div>}
      <div className="stat-glow" />
    </div>
  );
}
