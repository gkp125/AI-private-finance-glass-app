import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, getMonthlyTrend, getSpendingByCategory } from '../utils/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area
} from 'recharts';
import './Reports.css';

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="chart-tooltip-row">
          <span style={{ color: p.fill }}>{p.name === 'income' ? '↑ Income' : '↓ Expense'}</span>
          <span style={{ color: p.fill, fontWeight: 700 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function Reports() {
  const { transactions, categories, books } = useStore();
  const [selectedBook, setSelectedBook] = useState('all');
  const [period, setPeriod] = useState(6);

  const bookTxns = useMemo(() => {
    if (selectedBook === 'all') return transactions;
    return transactions.filter((t) => t.bookId === selectedBook);
  }, [transactions, selectedBook]);

  const trend = useMemo(() => getMonthlyTrend(bookTxns, period), [bookTxns, period]);
  const catSpending = useMemo(() => getSpendingByCategory(bookTxns, categories), [bookTxns, categories]);

  const totalIncome = bookTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = bookTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0;
  const avgMonthlyExpense = (totalExpense / period).toFixed(0);

  // Net savings trend
  const netTrend = trend.map((m) => ({ ...m, savings: m.income - m.expense }));

  // Top income categories
  const incomeByCategory = useMemo(() => {
    const map = {};
    bookTxns.filter((t) => t.type === 'income').forEach((t) => {
      if (!map[t.category]) map[t.category] = 0;
      map[t.category] += t.amount;
    });
    return Object.entries(map).map(([id, total]) => {
      const cat = categories.income.find((c) => c.id === id);
      return { id, name: cat?.name || id, icon: cat?.icon || '💰', color: cat?.color || '#34C759', total };
    }).sort((a, b) => b.total - a.total);
  }, [bookTxns, categories]);

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Detailed analytics and insights</p>
        </div>
        <div className="report-controls">
          <div className="select-wrapper">
            <select className="glass-select" style={{ padding: '9px 14px', fontSize: 13 }} value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)}>
              <option value="all">All Books</option>
              {books.map((b) => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
            </select>
            <span className="select-arrow">⌄</span>
          </div>
          <div className="period-tabs">
            {[3, 6].map((p) => (
              <button key={p} className={`period-tab ${period === p ? 'period-tab-active' : ''}`} onClick={() => setPeriod(p)}>{p}M</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row stagger">
        <KpiCard label="Savings Rate" value={`${savingsRate}%`} color={savingsRate >= 20 ? 'var(--green)' : savingsRate >= 10 ? 'var(--orange)' : 'var(--red)'} icon="◎" sub="Of total income saved" />
        <KpiCard label="Avg Monthly Expense" value={formatCurrency(parseInt(avgMonthlyExpense))} color="var(--red)" icon="↓" sub={`Over ${period} months`} />
        <KpiCard label="Total Saved" value={formatCurrency(totalIncome - totalExpense)} color={totalIncome - totalExpense >= 0 ? 'var(--green)' : 'var(--red)'} icon="✦" sub="Net position" />
        <KpiCard label="Transactions" value={bookTxns.length} color="var(--blue)" icon="◈" sub={`In last ${period} months`} />
      </div>

      {/* Charts */}
      <div className="reports-grid">
        {/* Monthly Bar */}
        <div className="glass-card report-chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Monthly Comparison</div>
              <div className="chart-sub">Income vs Expenses per month</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => '₹' + (v / 1000) + 'K'} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="income" name="income" fill="#34C759" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey="expense" name="expense" fill="#FF453A" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Net Savings Line */}
        <div className="glass-card report-chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Net Savings Trend</div>
              <div className="chart-sub">Monthly surplus/deficit</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={netTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5E5CE6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#5E5CE6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => '₹' + (v / 1000) + 'K'} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: 'rgba(14,14,22,0.95)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12 }} />
              <Area type="monotone" dataKey="savings" name="Net Savings" stroke="#5E5CE6" strokeWidth={2.5} fill="url(#savingsGrad)" dot={{ fill: '#5E5CE6', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Breakdown */}
      <div className="reports-grid-3">
        <div className="glass-card report-chart-card spending-breakdown">
          <div className="chart-header">
            <div className="chart-title">Top Expenses</div>
            <div className="chart-sub">by category</div>
          </div>
          <div className="spending-bars">
            {catSpending.slice(0, 8).map((s, i) => {
              const pct = totalExpense > 0 ? Math.round((s.total / totalExpense) * 100) : 0;
              return (
                <div key={s.id} className="spending-bar-row animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="spending-bar-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{pct}%</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(s.total, true)}</span>
                    </div>
                  </div>
                  <div className="spending-bar-track">
                    <div
                      className="spending-bar-fill"
                      style={{ width: pct + '%', background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card report-chart-card">
          <div className="chart-header">
            <div className="chart-title">Income Sources</div>
            <div className="chart-sub">by category</div>
          </div>
          <div className="spending-bars">
            {incomeByCategory.slice(0, 8).map((s, i) => {
              const pct = totalIncome > 0 ? Math.round((s.total / totalIncome) * 100) : 0;
              return (
                <div key={s.id} className="spending-bar-row animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="spending-bar-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{pct}%</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(s.total, true)}</span>
                    </div>
                  </div>
                  <div className="spending-bar-track">
                    <div className="spending-bar-fill" style={{ width: pct + '%', background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }} />
                  </div>
                </div>
              );
            })}
            {incomeByCategory.length === 0 && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                No income data for this period
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, icon, sub }) {
  return (
    <div className="kpi-card glass-card animate-fade-in">
      <div className="kpi-icon" style={{ color }}>{icon}</div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
