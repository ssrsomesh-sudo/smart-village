import { useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Residents from "./components/Residents";
import Settings from "./components/Settings";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "residents":
        return <Residents />;
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
          © 2024 Smart Village Dashboard | Built with ❤️ for rural development
        </p>
      </footer>
    </div>
  );
}

export default App;