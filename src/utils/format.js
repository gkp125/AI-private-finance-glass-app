import { CURRENCIES } from '../store/useStore';

// Call this with the currency code from settings (default INR)
export function formatCurrency(amount, compact = false, currencyCode = 'INR') {
  const cur = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const sym = cur.symbol;

  if (compact && Math.abs(amount) >= 100000) {
    return sym + (amount / 100000).toFixed(1) + 'L';
  }
  if (compact && Math.abs(amount) >= 1000) {
    return sym + (amount / 1000).toFixed(1) + 'K';
  }
  try {
    return new Intl.NumberFormat(cur.locale, {
      style: 'currency',
      currency: cur.code,
      maximumFractionDigits: currencyCode === 'JPY' ? 0 : 0,
    }).format(amount);
  } catch {
    return sym + Math.round(amount).toLocaleString();
  }
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getMonthLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export function groupByMonth(transactions) {
  const groups = {};
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return groups;
}

export function getSpendingByCategory(transactions, categories) {
  const map = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      if (!map[t.category]) map[t.category] = 0;
      map[t.category] += t.amount;
    });

  return Object.entries(map)
    .map(([catId, total]) => {
      const cat = categories.expense.find((c) => c.id === catId);
      return { id: catId, name: cat?.name || catId, icon: cat?.icon || '📦', color: cat?.color || '#8E8E93', total };
    })
    .sort((a, b) => b.total - a.total);
}

export function getMonthlyTrend(transactions, months = 6) {
  const now = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short' });

    const monthTxns = transactions.filter((t) => t.date.startsWith(key));
    const income = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    result.push({ label, income, expense, net: income - expense });
  }

  return result;
}

export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
