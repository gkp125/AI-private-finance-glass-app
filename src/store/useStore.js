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

export const useStore = create(
  persist(
    (set, get) => ({
      // App state
      activeBook: 'all',
      activeView: 'dashboard',
      aiChatOpen: false,
      theme: 'dark',

      // Data
      books: defaultBooks,
      categories: defaultCategories,
      transactions: sampleTransactions,
      aiMessages: [],
      aiAnalysisCache: null,

      // Actions
      setActiveView: (view) => set({ activeView: view }),
      setActiveBook: (bookId) => set({ activeBook: bookId }),
      toggleAiChat: () => set((s) => ({ aiChatOpen: !s.aiChatOpen })),

      addTransaction: (txn) => set((s) => ({
        transactions: [{ ...txn, id: uuidv4() }, ...s.transactions],
      })),

      updateTransaction: (id, updates) => set((s) => ({
        transactions: s.transactions.map((t) => t.id === id ? { ...t, ...updates } : t),
      })),

      deleteTransaction: (id) => set((s) => ({
        transactions: s.transactions.filter((t) => t.id !== id),
      })),

      addBook: (book) => set((s) => ({
        books: [...s.books, { ...book, id: uuidv4(), createdAt: format(new Date(), 'yyyy-MM-dd') }],
      })),

      deleteBook: (id) => set((s) => ({
        books: s.books.filter((b) => b.id !== id),
        transactions: s.transactions.filter((t) => t.bookId !== id),
      })),

      addCategory: (type, cat) => set((s) => ({
        categories: {
          ...s.categories,
          [type]: [...s.categories[type], { ...cat, id: uuidv4() }],
        },
      })),

      addAiMessage: (msg) => set((s) => ({
        aiMessages: [...s.aiMessages, { ...msg, id: uuidv4(), timestamp: new Date().toISOString() }],
      })),

      clearAiMessages: () => set({ aiMessages: [] }),

      setAiAnalysisCache: (data) => set({ aiAnalysisCache: data }),

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
    { name: 'cashbook-storage' }
  )
);
