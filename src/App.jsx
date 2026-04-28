import { useStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Books from './components/Books';
import Reports from './components/Reports';
import Settings from './components/Settings';
import AiAssistant from './components/AiAssistant';
import './App.css';

export default function App() {
  const { activeView, aiChatOpen } = useStore();

  const views = {
    dashboard: <Dashboard />,
    transactions: <Transactions />,
    books: <Books />,
    reports: <Reports />,
    settings: <Settings />,
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="app-content animate-fade-in" key={activeView}>
          {views[activeView] || <Dashboard />}
        </div>
      </main>
      {aiChatOpen && <AiAssistant />}
    </div>
  );
}
