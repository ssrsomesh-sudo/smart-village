import { useAuth } from "../context/AuthContext";

const Navbar = ({ currentPage, onPageChange }) => {
  const { currentUser, logout, isAdmin } = useAuth();

  // ✅ All menu items — adminOnly: true means hidden from normal user
  const allMenuItems = [
    { id: "dashboard",     label: "📊 Dashboard",   adminOnly: false },
    { id: "residents",     label: "👥 Residents",    adminOnly: false },
    { id: "birthdays",     label: "🎂 Birthdays",    adminOnly: false },
    { id: "search",        label: "🔍 Search",       adminOnly: false },
    { id: "template",      label: "📥 Template",     adminOnly: false },
    { id: "sms",           label: "📨 SMS Center",   adminOnly: true  },
    { id: "delete-village",label: "🗑️ Delete",       adminOnly: true  },
    { id: "bulk-delete",   label: "🧹 Bulk Delete",  adminOnly: true  },
    { id: "backup",        label: "💾 Backup",       adminOnly: true  },
    { id: "settings",      label: "⚙️ Settings",     adminOnly: true  },
  ];

  // ✅ Filter menu based on role
  const menuItems = allMenuItems.filter(
    (item) => !item.adminOnly || isAdmin()
  );

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success shadow-sm">
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="#">
          🌾 Smart Village
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {menuItems.map((item) => (
              <li className="nav-item" key={item.id}>
                <button
                  className={`nav-link btn btn-link ${
                    currentPage === item.id ? "active fw-bold" : ""
                  }`}
                  onClick={() => onPageChange(item.id)}
                  style={{
                    textDecoration: "none",
                    color:
                      currentPage === item.id
                        ? "#fff"
                        : "rgba(255,255,255,0.8)",
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {/* ✅ User info + logout on right side */}
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item me-2">
              <span
                className={`badge ${
                  isAdmin() ? "bg-warning text-dark" : "bg-light text-dark"
                } px-3 py-2`}
                style={{ fontSize: "0.8rem" }}
              >
                {isAdmin() ? "👑 Admin" : "👤 User"} — {currentUser?.username}
              </span>
            </li>
            <li className="nav-item">
              <button
                className="btn btn-outline-light btn-sm fw-bold"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;