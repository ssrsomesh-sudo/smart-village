function Navbar({ currentPage, onPageChange }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success shadow-sm">
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="#">
          🌾 Smart Village Dashboard
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${currentPage === 'dashboard' ? 'active fw-bold' : ''}`}
                onClick={() => onPageChange('dashboard')}
              >
                📊 Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${currentPage === 'residents' ? 'active fw-bold' : ''}`}
                onClick={() => onPageChange('residents')}
              >
                👥 Residents
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${currentPage === 'settings' ? 'active fw-bold' : ''}`}
                onClick={() => onPageChange('settings')}
              >
                ⚙️ Settings
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;