import { useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Residents from "./components/Residents";
import Settings from "./components/Settings";
import SearchFilter from "./components/SearchFilter";
import BackupRestore from "./components/BackupRestore";
import UpcomingBirthdays from "./components/UpcomingBirthdays";
import DeleteVillageRecords from "./components/DeleteVillageRecords";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "residents":
        return <Residents />;
      case "birthdays":
        return <UpcomingBirthdays />;
      case "search":
        return <SearchFilter />;
      case "delete-village":
        return <DeleteVillageRecords />;
      case "backup":
        return <BackupRestore />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
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
      case "backup":
        return "💾 Backup & Restore";
      case "settings":
        return "⚙️ System Settings";
      default:
        return "Dashboard";
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <div className="container-fluid py-4">
        <div className="mb-4">
          <h2 className="display-6 fw-bold text-success">
            {getPageTitle()}
          </h2>
          <hr />
        </div>
        
        {renderPage()}
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3 mt-5">
        <p className="mb-0">
          © 2025 Smart Village Dashboard | Built with ❤️ for rural development
        </p>
      </footer>
    </div>
  );
}

export default App;