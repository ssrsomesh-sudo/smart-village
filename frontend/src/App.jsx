import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Residents from "./components/Residents";
import Settings from "./components/Settings";
import SearchFilter from "./components/SearchFilter";
import BackupRestore from "./components/BackupRestore";
import UpcomingBirthdays from "./components/UpcomingBirthdays";
import DeleteVillageRecords from "./components/DeleteVillageRecords";
import DateTimeBar from "./components/DateTimeBar";
import TemplateDownload from './components/TemplateDownload';
import BulkDeleteUtility from './components/BulkDeleteUtility';
import SMSCenter from "./components/SMSCenter";
import { API_URL } from './config/api';

// ─────────────────────────────────────────────
// Inner app — only rendered when logged in
// ─────────────────────────────────────────────
function AppContent() {
  const { currentUser, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");

  // ✅ Centralized data management
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    loadAllRecords();
  }, []);

  const loadAllRecords = async () => {
    if (dataLoaded) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/records`);
      const data = await res.json();
      setAllRecords(data);
      setDataLoaded(true);
    } catch (err) {
      console.error("Error loading records:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const res = await fetch(`${API_URL}/records`);
      const data = await res.json();
      setAllRecords(data);
    } catch (err) {
      console.error("Error refreshing records:", err);
    }
  };

  // ✅ Guard: if a normal user tries to navigate to an admin page, redirect to dashboard
  const adminPages = ["sms", "delete-village", "bulk-delete", "backup", "settings"];
  const safePage = adminPages.includes(currentPage) && !isAdmin()
    ? "dashboard"
    : currentPage;

  if (safePage !== currentPage) {
    setCurrentPage("dashboard");
  }

  const renderPage = () => {
    if (loading && !dataLoaded) {
      return (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading application data...</p>
        </div>
      );
    }

    switch (currentPage) {
      case "dashboard":
        return <Dashboard records={allRecords} refreshData={refreshData} />;
      case "residents":
        return <Residents records={allRecords} refreshData={refreshData} />;
      case "birthdays":
        return <UpcomingBirthdays records={allRecords} refreshData={refreshData} />;
      case "search":
        return <SearchFilter records={allRecords} />;
      case "template":
        return <TemplateDownload />;
      // Admin-only pages below
      case "sms":
        return isAdmin() ? <SMSCenter records={allRecords} refreshData={refreshData} /> : null;
      case "delete-village":
        return isAdmin() ? <DeleteVillageRecords records={allRecords} refreshData={refreshData} /> : null;
      case "bulk-delete":
        return isAdmin() ? <BulkDeleteUtility records={allRecords} refreshData={refreshData} /> : null;
      case "backup":
        return isAdmin() ? <BackupRestore refreshData={refreshData} /> : null;
      case "settings":
        return isAdmin() ? <Settings /> : null;
      default:
        return <Dashboard records={allRecords} refreshData={refreshData} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case "dashboard":      return "📊 Dashboard Overview";
      case "residents":      return "👥 Residents Management";
      case "birthdays":      return "🎂 Upcoming Birthdays";
      case "search":         return "🔍 Advanced Search & Filter";
      case "delete-village": return "🗑️ Delete Village Records";
      case "bulk-delete":    return "🧹 Bulk Delete Utility";
      case "backup":         return "💾 Backup & Restore";
      case "template":       return "📥 Download Excel Template";
      case "sms":            return "📨 SMS Center";
      case "settings":       return "⚙️ System Settings";
      default:               return "Dashboard";
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      <DateTimeBar />
      <div className="container-fluid py-4">
        <div className="mb-4">
          <h2 className="display-6 fw-bold text-success">
            {getPageTitle()}
          </h2>
          <hr />
        </div>
        {renderPage()}
      </div>
      <footer className="bg-dark text-white text-center py-3 mt-5">
        <p className="mb-0">
          © 2026 Smart Village Dashboard | Built with ❤️ for rural development
        </p>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────
// Root: shows Login or App based on auth state
// ─────────────────────────────────────────────
function AppRouter() {
  const { currentUser } = useAuth();
  return currentUser ? <AppContent /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;