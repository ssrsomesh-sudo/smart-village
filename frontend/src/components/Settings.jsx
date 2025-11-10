import { useState } from "react";

function Settings() {
  const [orgLogo, setOrgLogo] = useState(null);
  const [language, setLanguage] = useState("en");
  const [message, setMessage] = useState("");

  const handleLogoUpload = (e) => {
   const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgLogo(reader.result);
        localStorage.setItem("orgLogo", reader.result);
        setMessage("✅ Logo uploaded successfully!");
        setTimeout(() => setMessage(""), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    localStorage.setItem("language", e.target.value);
    setMessage("✅ Language preference saved!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleExportData = async () => {
    try {
      const res = await fetch("https://smart-village-cn6f.onrender.com/records");
      const data = await res.json();
      
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `smart-village-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      setMessage("✅ Data exported successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to export data");
      console.error(err);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm("⚠️ WARNING: This will delete ALL records. Are you absolutely sure?")) {
      return;
    }

    if (!window.confirm("This action CANNOT be undone! Type 'DELETE' to confirm.")) {
      return;
    }

    setMessage("🗑️ This feature requires backend implementation for safety.");
  };

  return (
    <div>
      <div className="row">
        {/* Organization Logo */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">🏢 Organization Logo</h5>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                {orgLogo ? (
                  <img 
                    src={orgLogo} 
                    alt="Organization Logo" 
                    style={{ maxWidth: "200px", maxHeight: "200px" }}
                    className="img-thumbnail"
                  />
                ) : (
                  <div className="border rounded p-5 bg-light">
                    <p className="text-muted mb-0">No logo uploaded</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <small className="text-muted">
                Recommended: Square image, max 500KB
              </small>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">🌐 Language Preference</h5>
            </div>
            <div className="card-body">
              <label className="form-label fw-bold">Select Language</label>
              <select
                className="form-select form-select-lg"
                value={language}
                onChange={handleLanguageChange}
              >
                <option value="en">English</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>
              <small className="text-muted mt-2 d-block">
                Current: <strong>{language === "en" ? "English" : language === "te" ? "Telugu" : language}</strong>
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">💾 Data Management</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="card border-info">
                    <div className="card-body text-center">
                      <h6 className="card-title">📥 Import Data</h6>
                      <p className="card-text small text-muted">
                        Import records from Excel file
                      </p>
                      <button 
                        className="btn btn-info"
                        onClick={() => alert("Use the Residents page → Import Excel button")}
                      >
                        Go to Import
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card border-success">
                    <div className="card-body text-center">
                      <h6 className="card-title">📤 Export Data</h6>
                      <p className="card-text small text-muted">
                        Download backup of all records
                      </p>
                      <button 
                        className="btn btn-success"
                        onClick={handleExportData}
                      >
                        Export JSON
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card border-danger">
                    <div className="card-body text-center">
                      <h6 className="card-title">🗑️ Clear All Data</h6>
                      <p className="card-text small text-muted">
                        Delete all records (dangerous!)
                      </p>
                      <button 
                        className="btn btn-danger"
                        onClick={handleClearData}
                      >
                        Clear Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-warning mt-4 mb-0">
                <strong>⚠️ Important:</strong>
                <ul className="mb-0 mt-2">
                  <li>Always backup your data before clearing</li>
                  <li>Export creates a JSON backup file</li>
                  <li>Import is done via backend script for data validation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Stats */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">📊 Database Statistics</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3">
                  <h3 className="text-primary">--</h3>
                  <p className="text-muted">Total Records</p>
                </div>
                <div className="col-md-3">
                  <h3 className="text-success">--</h3>
                  <p className="text-muted">Total Mandals</p>
                </div>
                <div className="col-md-3">
                  <h3 className="text-info">--</h3>
                  <p className="text-muted">Total Villages</p>
                </div>
                <div className="col-md-3">
                  <h3 className="text-warning">--</h3>
                  <p className="text-muted">Database Size</p>
                </div>
              </div>
              <p className="text-muted text-center mb-0 mt-3">
                <small>Statistics will be available after backend implementation</small>
              </p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert mt-4 ${
          message.includes("✅") ? "alert-success" : "alert-warning"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default Settings;