import { useState, useEffect } from "react";
import FilterBar from "./FilterBar";

function Residents() {
  const [form, setForm] = useState({
    mandalName: "",
    villageName: "",
    name: "",
    numFamilyPersons: "",
    gender: "MALE",
    phoneNumber: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMandal, setSelectedMandal] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://smart-village-cn6f.onrender.com/records");
      const data = await res.json();
      setRecords(data);
      setFilteredRecords(data);
      
      const uniqueMandals = [...new Set(data.map(r => r.mandalName))].filter(Boolean).sort();
      setMandals(uniqueMandals);
    } catch (err) {
      console.error("Error loading records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = records;

    if (selectedMandal) {
      filtered = filtered.filter(r => r.mandalName === selectedMandal);
      const uniqueVillages = [...new Set(filtered.map(r => r.villageName))].filter(Boolean).sort();
      setVillages(uniqueVillages);
    } else {
      setVillages([]);
      setSelectedVillage("");
    }

    if (selectedVillage) {
      filtered = filtered.filter(r => r.villageName === selectedVillage);
    }

    setFilteredRecords(filtered);
  }, [selectedMandal, selectedVillage, records]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("💾 Saving...");
  const API_URL = "https://smart-village-cn6f.onrender.com";
    try {
      const url = editingId 
        ? `${API_URL}/records/${editingId}`
        : `${API_URL}/records`;
      
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setMessage(editingId ? "✅ Record updated!" : "✅ Record saved!");
        setForm({
          mandalName: "",
          villageName: "",
          name: "",
          numFamilyPersons: "",
          gender: "MALE",
          phoneNumber: "",
          address: "",
        });
        setEditingId(null);
        loadRecords();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Failed to save record.");
      }
    } catch (err) {
      setMessage("⚠️ Cannot connect to backend.");
    }
  };

  const handleEdit = (record) => {
    setForm({
      mandalName: record.mandalName,
      villageName: record.villageName,
      name: record.name,
      numFamilyPersons: record.numFamilyPersons.toString(),
      gender: record.gender || "MALE",
      phoneNumber: record.phoneNumber,
      address: record.address || "",
    });
    setEditingId(record.id);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setForm({
      mandalName: "",
      villageName: "",
      name: "",
      numFamilyPersons: "",
      gender: "MALE",
      phoneNumber: "",
      address: "",
    });
    setEditingId(null);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete record for "${name}"?`)) return;

    try {
      const response = fetch(`${API_URL}/records/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("✅ Record deleted!");
        loadRecords();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Failed to delete.");
      }
    } catch (err) {
      setMessage("⚠️ Cannot connect to backend.");
    }
  };

  const resetFilters = () => {
    setSelectedMandal("");
    setSelectedVillage("");
  };

  return (
    <div>
      <FilterBar
        mandals={mandals}
        villages={villages}
        selectedMandal={selectedMandal}
        selectedVillage={selectedVillage}
        onMandalChange={setSelectedMandal}
        onVillageChange={setSelectedVillage}
        onReset={resetFilters}
      />

      {/* Action Buttons */}
      <div className="mb-4 d-flex gap-2">
        <button 
          className="btn btn-primary"
          onClick={() => setShowImportModal(true)}
        >
          📥 Import Excel
        </button>
      </div>

      {/* Add/Edit Form */}
      <div className="card shadow-sm mb-4">
        <div className={`card-header text-white ${editingId ? 'bg-warning' : 'bg-success'}`}>
          <h5 className="mb-0">
            {editingId ? "✏️ Edit Resident" : "➕ Add New Resident"}
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Mandal <span className="text-danger">*</span></label>
                <input
                  className="form-control"
                  name="mandalName"
                  value={form.mandalName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Village <span className="text-danger">*</span></label>
                <input
                  className="form-control"
                  name="villageName"
                  value={form.villageName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Person Name <span className="text-danger">*</span></label>
                <input
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">No. of Members <span className="text-danger">*</span></label>
                <input
                  type="number"
                  className="form-control"
                  name="numFamilyPersons"
                  value={form.numFamilyPersons}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Gender</label>
                <select
                  className="form-select"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Phone <span className="text-danger">*</span></label>
                <input
                  className="form-control"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Address</label>
              <textarea
                className="form-control"
                rows="2"
                name="address"
                value={form.address}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="d-flex gap-2">
              <button className={`btn btn-lg flex-grow-1 ${editingId ? 'btn-warning' : 'btn-success'}`} type="submit">
                {editingId ? "💾 Update" : "💾 Save"}
              </button>
              {editingId && (
                <button className="btn btn-secondary btn-lg" type="button" onClick={handleCancelEdit}>
                  ❌ Cancel
                </button>
              )}
            </div>
          </form>

          {message && (
            <div className={`alert mt-3 text-center ${
              message.includes("✅") ? "alert-success" : 
              message.includes("❌") ? "alert-danger" : "alert-info"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            📋 Residents List
            <span className="badge bg-light text-dark ms-2">
              {filteredRecords.length} / {records.length}
            </span>
          </h5>
        </div>
        <div className="card-body p-0">
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            <table className="table table-hover table-striped mb-0">
              <thead className="table-success sticky-top">
                <tr>
                  <th>#</th>
                  <th>Mandal</th>
                  <th>Village</th>
                  <th>Name of the Person</th>
                  <th>Members</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, index) => (
                  <tr key={r.id}>
                    <td>{index + 1}</td>
                    <td>{r.mandalName}</td>
                    <td>{r.villageName}</td>
                    <td>{r.name}</td>
                    <td><span className="badge bg-info">{r.numFamilyPersons}</span></td>
                    <td>{r.gender}</td>
                    <td>{r.phoneNumber}</td>
                    <td>{r.address || "-"}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-warning" onClick={() => handleEdit(r)}>✏️</button>
                        <button className="btn btn-danger" onClick={() => handleDelete(r.id, r.name)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      No residents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">📥 Import Excel File</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowImportModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <strong>Instructions:</strong>
                  <ol className="mb-0 mt-2">
                    <li>Use the import script: <code>node importFamilyRecords.js</code></li>
                    <li>Place your Excel file in the backend folder</li>
                    <li>Update the filename in the script</li>
                    <li>Run the script from backend folder</li>
                  </ol>
                </div>
                <p className="text-muted">
                  Note: Excel import is handled via the backend script for better data validation and processing.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Residents;