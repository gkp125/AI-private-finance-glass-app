import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const defaultCategories = {
  income: [
    { id: 'sal', name: 'Salary', icon: '💼', color: '#34C759' },
    { id: 'biz', name: 'Business', icon: '🏢', color: '#30D158' },
    { id: 'inv', name: 'Investment', icon: '📈', color: '#32ADE6' },
    { id: 'gift', name: 'Gift', icon: '🎁', color: '#FF9F0A' },
    { id: 'rent_in', name: 'Rental Income', icon: '🏠', color: '#64D2FF' },
    { id: 'other_in', name: 'Other Income', icon: '💰', color: '#5E5CE6' },
  ],
  expense: [
    { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#FF453A' },
    { id: 'trans', name: 'Transport', icon: '🚗', color: '#FF9F0A' },
    { id: 'shop', name: 'Shopping', icon: '🛍️', color: '#BF5AF2' },
    { id: 'util', name: 'Utilities', icon: '💡', color: '#0A84FF' },
    { id: 'health', name: 'Health', icon: '🏥', color: '#FF375F' },
    { id: 'ent', name: 'Entertainment', icon: '🎬', color: '#FF6B6B' },
    { id: 'edu', name: 'Education', icon: '📚', color: '#32ADE6' },
    { id: 'rent', name: 'Rent', icon: '🏡', color: '#30B0C7' },
    { id: 'travel', name: 'Travel', icon: '✈️', color: '#5E5CE6' },
    { id: 'other_ex', name: 'Other Expense', icon: '📦', color: '#8E8E93' },
  ],
};

const sampleTransactions = [
  { id: uuidv4(), type: 'income', amount: 85000, category: 'sal', note: 'Monthly salary - March', date: '2026-03-01', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'expense', amount: 18000, category: 'rent', note: 'Apartment rent', date: '2026-03-02', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'expense', amount: 3200, category: 'food', note: 'Weekly groceries + dining', date: '2026-03-03', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'income', amount: 12000, category: 'biz', note: 'Freelance project payment', date: '2026-03-05', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'expense', amount: 2800, category: 'trans', note: 'Fuel + Metro monthly pass', date: '2026-03-06', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'expense', amount: 5500, category: 'shop', note: 'Clothes and accessories', date: '2026-03-08', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'expense', amount: 1200, category: 'ent', note: 'Movie tickets + OTT subscriptions', date: '2026-03-10', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'income', amount: 8500, category: 'inv', note: 'Stock dividends', date: '2026-03-11', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'expense', amount: 900, category: 'util', note: 'Electricity bill', date: '2026-03-12', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'expense', amount: 4200, category: 'health', note: 'Doctor visit + medicines', date: '2026-03-13', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'expense', amount: 6500, category: 'edu', note: 'Online course subscription', date: '2026-03-14', bookId: 'personal', attachment: null },
  { id: uuidv4(), type: 'income', amount: 3200, category: 'rent_in', note: 'Parking lot rental income', date: '2026-03-14', bookId: 'business', attachment: null },
  { id: uuidv4(), type: 'expense', amount: 15000, category: 'travel', note: 'Weekend trip to Goa', date: '2026-03-15', bookId: 'personal', attachment: null },
];

const defaultBooks = [
  { id: 'personal', name: 'Personal', icon: '👤', color: '#0A84FF', description: 'Personal expenses and income', createdAt: '2026-01-01' },
  { id: 'business', name: 'Business', icon: '🏢', color: '#34C759', description: 'Business transactions', createdAt: '2026-01-01' },
  { id: 'home', name: 'Home', icon: '🏠', color: '#FF9F0A', description: 'Home and family expenses', createdAt: '2026-01-01' },
];

const defaultBudgets = [
  { id: uuidv4(), categoryId: 'food', limit: 5000, month: '2026-03' },
  { id: uuidv4(), categoryId: 'trans', limit: 4000, month: '2026-03' },
  { id: uuidv4(), categoryId: 'shop', limit: 8000, month: '2026-03' },
  { id: uuidv4(), categoryId: 'ent', limit: 2000, month: '2026-03' },
];

const defaultGoals = [
  { id: uuidv4(), name: 'Emergency Fund', target: 200000, saved: 45000, targetDate: '2026-12-31', icon: '🛡️', color: '#34C759', createdAt: '2026-01-01' },
  { id: uuidv4(), name: 'New Laptop', target: 120000, saved: 30000, targetDate: '2026-06-30', icon: '💻', color: '#0A84FF', createdAt: '2026-01-01' },
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'INR ₹' },
  { code: 'USD', symbol: '$', locale: 'en-US', label: 'USD $' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', label: 'EUR €' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', label: 'GBP £' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP', label: 'JPY ¥' },
  { code: 'AED', symbol: 'د.إ', locale: 'ar-AE', label: 'AED د.إ' },
  { code: 'SGD', symbol: 'S$', locale: 'en-SG', label: 'SGD S$' },
];

export const useStore = create(
  persist(
    (set, get) => ({
      // UI state
      activeBook: 'all',
      activeView: 'dashboard',
      aiChatOpen: false,
      aiPanelCollapsed: false,
      theme: 'dark',

      // Data
      books: defaultBooks,
      categories: defaultCategories,
      transactions: sampleTransactions,
      budgets: defaultBudgets,
      goals: defaultGoals,
      aiMessages: [],
      aiAnalysisCache: null,

      // Settings
      settings: {
        aiProvider: 'claude',
        claudeKey: '',
        geminiKey: '',
        currency: 'INR',
      },

      // ── UI actions ─────────────────────────────────────────────────
      setActiveView: (view) => set({ activeView: view }),
      setActiveBook: (bookId) => set({ activeBook: bookId }),
      toggleAiChat: () => set((s) => ({ aiChatOpen: !s.aiChatOpen })),
      setAiPanelCollapsed: (v) => set({ aiPanelCollapsed: v }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      // ── Settings ───────────────────────────────────────────────────
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      // ── Transactions ───────────────────────────────────────────────
      addTransaction: (txn) => set((s) => ({
        transactions: [{ ...txn, id: uuidv4() }, ...s.transactions],
      })),
      updateTransaction: (id, updates) => set((s) => ({
        transactions: s.transactions.map((t) => t.id === id ? { ...t, ...updates } : t),
      })),
      deleteTransaction: (id) => set((s) => ({
        transactions: s.transactions.filter((t) => t.id !== id),
      })),

      // ── Books ──────────────────────────────────────────────────────
      addBook: (book) => set((s) => ({
        books: [...s.books, { ...book, id: uuidv4(), createdAt: format(new Date(), 'yyyy-MM-dd') }],
      })),
      deleteBook: (id) => set((s) => ({
        books: s.books.filter((b) => b.id !== id),
        transactions: s.transactions.filter((t) => t.bookId !== id),
      })),

      // ── Categories ─────────────────────────────────────────────────
      addCategory: (type, cat) => set((s) => ({
        categories: {
          ...s.categories,
          [type]: [...s.categories[type], { ...cat, id: uuidv4() }],
        },
      })),
      deleteCategory: (type, id) => set((s) => ({
        categories: {
          ...s.categories,
          [type]: s.categories[type].filter((c) => c.id !== id),
        },
      })),

      // ── Budgets ────────────────────────────────────────────────────
      upsertBudget: (budget) => set((s) => {
        const exists = s.budgets.find((b) => b.categoryId === budget.categoryId && b.month === budget.month);
        if (exists) {
          return { budgets: s.budgets.map((b) => b.id === exists.id ? { ...b, limit: budget.limit } : b) };
        }
        return { budgets: [...s.budgets, { ...budget, id: uuidv4() }] };
      }),
      deleteBudget: (id) => set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),
      getBudgetSpent: (categoryId, month) => {
        const { transactions } = get();
        return transactions
          .filter((t) => t.type === 'expense' && t.category === categoryId && t.date.startsWith(month))
          .reduce((sum, t) => sum + t.amount, 0);
      },

      // ── Goals ──────────────────────────────────────────────────────
      addGoal: (goal) => set((s) => ({
        goals: [...s.goals, { ...goal, id: uuidv4(), saved: 0, createdAt: format(new Date(), 'yyyy-MM-dd') }],
      })),
      updateGoal: (id, updates) => set((s) => ({
        goals: s.goals.map((g) => g.id === id ? { ...g, ...updates } : g),
      })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      contributeToGoal: (id, amount) => set((s) => ({
        goals: s.goals.map((g) => g.id === id ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g),
      })),

      // ── AI ─────────────────────────────────────────────────────────
      addAiMessage: (msg) => set((s) => ({
        aiMessages: [...s.aiMessages, { ...msg, id: uuidv4(), timestamp: new Date().toISOString() }],
      })),
      clearAiMessages: () => set({ aiMessages: [] }),
      setAiAnalysisCache: (data) => set({ aiAnalysisCache: data }),

      // ── Selectors ──────────────────────────────────────────────────
      getFilteredTransactions: (bookId) => {
        const { transactions } = get();
        if (!bookId || bookId === 'all') return transactions;
        return transactions.filter((t) => t.bookId === bookId);
      },
      getBalance: (bookId) => {
        const txns = get().getFilteredTransactions(bookId);
        return txns.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
      },
      getTotalIncome: (bookId) => {
        const txns = get().getFilteredTransactions(bookId);
        return txns.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      },
      getTotalExpense: (bookId) => {
        const txns = get().getFilteredTransactions(bookId);
        return txns.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      },
    }),
    {
      name: 'cashbook-storage',
      partialize: (state) => ({
        transactions: state.transactions,
        budgets: state.budgets,
        goals: state.goals,
        settings: state.settings,
        books: state.books,
        categories: state.categories,
        theme: state.theme,
        aiPanelCollapsed: state.aiPanelCollapsed,
      }),
    }
  )
);
