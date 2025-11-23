const Navbar = ({ currentPage, onPageChange }) => {
  const menuItems = [
    { id: "dashboard", label: "📊 Dashboard", icon: "📊" },
    { id: "residents", label: "👥 Residents", icon: "👥" },
    { id: "birthdays", label: "🎂 Birthdays", icon: "🎂" },
    { id: "search", label: "🔍 Search", icon: "🔍" },
    { id: "delete-village", label: "🗑️ Delete", icon: "🗑️" },
    { id: "backup", label: "💾 Backup", icon: "💾" },
    { id: "settings", label: "⚙️ Settings", icon: "⚙️" },
  ];

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
          <ul className="navbar-nav ms-auto">
            {menuItems.map((item) => (
              <li className="nav-item" key={item.id}>
                <button
                  className={`nav-link btn btn-link ${
                    currentPage === item.id ? "active fw-bold" : ""
                  }`}
                  onClick={() => onPageChange(item.id)}
                  style={{
                    textDecoration: "none",
                    color: currentPage === item.id ? "#fff" : "rgba(255,255,255,0.8)",
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;