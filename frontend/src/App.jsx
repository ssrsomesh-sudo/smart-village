import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Residents from "./components/Residents";
import Settings from "./components/Settings";
import SearchFilter from "./components/SearchFilter";
import BackupRestore from "./components/BackupRestore";
import UpcomingBirthdays from "./components/UpcomingBirthdays";
import DeleteVillageRecords from "./components/DeleteVillageRecords";
import DateTimeBar from "./components/DateTimeBar";
import TemplateDownload from './components/TemplateDownload';
import BulkDeleteUtility from './components/BulkDeleteUtility'; // ⭐ ADD THIS
import { API_URL } from './config/api';

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  
  // ✅ Centralized data management - loaded once and shared
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ✅ Load data once when app starts
  useEffect(() => {
    loadAllRecords();
  }, []);

  const loadAllRecords = async () => {
    if (dataLoaded) return; // Don't reload if already loaded
    
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

  // ✅ Function to refresh data (called after add/edit/delete)
  const refreshData = async () => {
    try {
      const res = await fetch(`${API_URL}/records`);
      const data = await res.json();
      setAllRecords(data);
    } catch (err) {
      console.error("Error refreshing records:", err);
    }
  };

  const renderPage = () => {
    // Show loading only on initial data fetch
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

    // ✅ Pass data and refresh function to components
    switch (currentPage) {
      case "dashboard":
        return <Dashboard records={allRecords} refreshData={refreshData} />;
      case "residents":
        return <Residents records={allRecords} refreshData={refreshData} />;
      case "birthdays":
        return <UpcomingBirthdays records={allRecords} refreshData={refreshData} />;
      case "search":
        return <SearchFilter records={allRecords} />;
      case "delete-village":
        return <DeleteVillageRecords records={allRecords} refreshData={refreshData} />;
      case "bulk-delete":  // ⭐ ADD THIS
        return <BulkDeleteUtility records={allRecords} refreshData={refreshData} />;
      case "backup":
        return <BackupRestore refreshData={refreshData} />;
      case "template":
        return <TemplateDownload />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard records={allRecords} refreshData={refreshData} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case "dashboard":
        return "📊 Dashboard Overview";
      case "residents":
        return "👥 Residents Management";
      case "birthdays":
        return "🎂 Upcoming Birthdays";
      case "search":
        return "🔍 Advanced Search & Filter";
      case "delete-village":
        return "🗑️ Delete Village Records";
      case "bulk-delete":  // ⭐ ADD THIS
        return "🧹 Bulk Delete Utility";
      case "backup":
        return "💾 Backup & Restore";
      case "template":
        return "📥 Download Excel Template";
      case "settings":
        return "⚙️ System Settings";
      default:
        return "Dashboard";
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
          © 2025 Smart Village Dashboard | Built with ❤️ for rural development
        </p>
      </footer>
    </div>
  );
}

export default App;