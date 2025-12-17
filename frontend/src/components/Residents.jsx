import { useState, useEffect } from "react";
import FilterBar from "./FilterBar";
import { API_URL } from '../config/api';

function Residents() {
  const [form, setForm] = useState({
    mandalName: "",
    villageName: "",
    rationCard: "",
    voterCard: "",
    name: "",
    numFamilyPersons: "",
    address: "",
    phoneNumber: "",
    aadhar: "",
    gender: "MALE",
    dateOfBirth: "",
    qualification: "",
    caste: "",
    subCaste: "",
    occupation: "",
    needEmployment: "",
    arogyasriCardNumber: "",
    shgMember: "",
    schemesEligible: "",
  });
  
  const [message, setMessage] = useState("");
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedMandal, setSelectedMandal] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);

  // ✅ Fetch mandals on component mount
  useEffect(() => {
    fetchMandals();
  }, []);

  const fetchMandals = async () => {
    try {
      // Fetch a few records just to get mandal list
      const response = await fetch(`${API_URL}/records?limit=100`);
      const data = await response.json();
      const records = data.records || data;
      const uniqueMandals = [...new Set(records.map(r => r.mandalName))].filter(Boolean).sort();
      setMandals(uniqueMandals);
    } catch (error) {
      console.error('Error fetching mandals:', error);
    }
  };

  // ✅ Fetch villages when mandal changes
  useEffect(() => {
    if (!selectedMandal) {
      setVillages([]);
      setSelectedVillage("");
      setFilteredRecords([]);
      return;
    }

    fetchVillages(selectedMandal);
  }, [selectedMandal]);

  const fetchVillages = async (mandal) => {
    try {
      const response = await fetch(`${API_URL}/records?mandalName=${mandal}&limit=100`);
      const data = await response.json();
      const records = data.records || data;
      const uniqueVillages = [...new Set(records.map(r => r.villageName))].filter(Boolean).sort();
      setVillages(uniqueVillages);
    } catch (error) {
      console.error('Error fetching villages:', error);
    }
  };

  // ✅ Fetch filtered records when village changes
  useEffect(() => {
    if (!selectedMandal || !selectedVillage) {
      setFilteredRecords([]);
      setTotalRecords(0);
      return;
    }

    fetchFilteredRecords();
    setCurrentPage(1); // Reset to first page
  }, [selectedMandal, selectedVillage]);

  const fetchFilteredRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mandalName: selectedMandal,
        villageName: selectedVillage,
        page: 1,
        limit: 1000 // Get all records for selected village (villages are small)
      });

      const response = await fetch(`${API_URL}/records?${params.toString()}`);
      const data = await response.json();
      
      console.log('📊 Fetched records:', data);

      if (data.records) {
        // New format with pagination
        setFilteredRecords(data.records);
        setTotalRecords(data.pagination?.total || data.records.length);
      } else {
        // Old format (array)
        setFilteredRecords(data);
        setTotalRecords(data.length);
      }
    } catch (error) {
      console.error('❌ Error fetching filtered records:', error);
      setMessage('⚠️ Error loading records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Date formatter function - DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("💾 Saving...");

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
          rationCard: "",
          voterCard: "",
          name: "",
          numFamilyPersons: "",
          address: "",
          phoneNumber: "",
          aadhar: "",
          gender: "MALE",
          dateOfBirth: "",
          qualification: "",
          caste: "",
          subCaste: "",
          occupation: "",
          needEmployment: "",
          arogyasriCardNumber: "",
          shgMember: "",
          schemesEligible: "",
        });
        setEditingId(null);
        
        // ✅ Refresh records after save
        if (selectedMandal && selectedVillage) {
          fetchFilteredRecords();
        }
        
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Failed to save record.");
      }
    } catch (err) {
      console.error("Error saving record:", err);
      setMessage("⚠️ Cannot connect to backend.");
    }
  };

  const handleEdit = (record) => {
    setForm({
      mandalName: record.mandalName || "",
      villageName: record.villageName || "",
      rationCard: record.rationCard || "",
      voterCard: record.voterCard || "",
      name: record.name || "",
      numFamilyPersons: record.numFamilyPersons || "",
      address: record.address || "",
      phoneNumber: record.phoneNumber || "",
      aadhar: record.aadhar || "",
      gender: record.gender || "MALE",
      dateOfBirth: formatDateForInput(record.dateOfBirth) || "",
      qualification: record.qualification || "",
      caste: record.caste || "",
      subCaste: record.subCaste || "",
      occupation: record.occupation || "",
      needEmployment: record.needEmployment || "",
      arogyasriCardNumber: record.arogyasriCardNumber || "",
      shgMember: record.shgMember || "",
      schemesEligible: record.schemesEligible || "",
    });
    setEditingId(record.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(`⚠️ Are you sure you want to delete:\n\n"${name}"?\n\nThis action cannot be undone!`);
    if (!confirmDelete) return;

    setMessage("🗑️ Deleting...");
    try {
      const response = await fetch(`${API_URL}/records/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("✅ Record deleted!");
        
        // ✅ Refresh records after delete
        if (selectedMandal && selectedVillage) {
          fetchFilteredRecords();
        }
        
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Failed to delete record.");
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      setMessage("⚠️ Cannot connect to backend.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      mandalName: "",
      villageName: "",
      rationCard: "",
      voterCard: "",
      name: "",
      numFamilyPersons: "",
      address: "",
      phoneNumber: "",
      aadhar: "",
      gender: "MALE",
      dateOfBirth: "",
      qualification: "",
      caste: "",
      subCaste: "",
      occupation: "",
      needEmployment: "",
      arogyasriCardNumber: "",
      shgMember: "",
      schemesEligible: "",
    });
  };

  const resetFilters = () => {
    setSelectedMandal("");
    setSelectedVillage("");
    setFilteredRecords([]);
  };

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleRecordsPerPageChange = (e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div>
      {/* Filter Bar */}
      <FilterBar
        mandals={mandals}
        villages={villages}
        selectedMandal={selectedMandal}
        selectedVillage={selectedVillage}
        onMandalChange={setSelectedMandal}
        onVillageChange={setSelectedVillage}
        onReset={resetFilters}
      />

      {/* Add/Edit Form */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">{editingId ? "✏️ Edit Record" : "➕ Add New Resident"}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Mandal Name <span className="text-danger">*</span></label>
                <input className="form-control" name="mandalName" value={form.mandalName} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Village Name <span className="text-danger">*</span></label>
                <input className="form-control" name="villageName" value={form.villageName} onChange={handleChange} required />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Ration Card</label>
                <input className="form-control" name="rationCard" value={form.rationCard} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Voter Card</label>
                <input className="form-control" name="voterCard" value={form.voterCard} onChange={handleChange} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Name <span className="text-danger">*</span></label>
                <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Phone Number</label>
                <input className="form-control" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label fw-bold">Number of Family Members</label>
                <input className="form-control" type="number" name="numFamilyPersons" value={form.numFamilyPersons} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Gender <span className="text-danger">*</span></label>
                <select className="form-select" name="gender" value={form.gender} onChange={handleChange} required>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Date of Birth</label>
                <input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Aadhar Number</label>
                <input className="form-control" name="aadhar" value={form.aadhar} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Qualification</label>
                <input className="form-control" name="qualification" value={form.qualification} onChange={handleChange} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Occupation</label>
                <input className="form-control" name="occupation" value={form.occupation} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Caste</label>
                <input className="form-control" name="caste" value={form.caste} onChange={handleChange} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Sub Caste</label>
                <input className="form-control" name="subCaste" value={form.subCaste} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Need Employment</label>
                <input className="form-control" name="needEmployment" value={form.needEmployment} onChange={handleChange} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Arogyasri Card Number</label>
                <input className="form-control" name="arogyasriCardNumber" value={form.arogyasriCardNumber} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">SHG Member</label>
                <input className="form-control" name="shgMember" value={form.shgMember} onChange={handleChange} />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Schemes Eligible</label>
              <input className="form-control" name="schemesEligible" value={form.schemesEligible} onChange={handleChange} />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Address <span className="text-danger">*</span></label>
              <textarea className="form-control" rows="2" name="address" value={form.address} onChange={handleChange} required></textarea>
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

      {/* Instructions when no filters selected */}
      {!selectedMandal && !selectedVillage && (
        <div className="alert alert-info">
          <h5 className="alert-heading">📋 How to View Records</h5>
          <ol className="mb-0">
            <li>Select a <strong>Mandal</strong> from the filter above</li>
            <li>Then select a <strong>Village</strong></li>
            <li>Records will appear with pagination options</li>
          </ol>
        </div>
      )}

      {/* Message when only mandal selected */}
      {selectedMandal && !selectedVillage && (
        <div className="alert alert-warning">
          <strong>⚠️ Please select a Village</strong> to view records from {selectedMandal}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading records...</p>
        </div>
      )}

      {/* Table - Only show when BOTH mandal AND village are selected */}
      {selectedMandal && selectedVillage && !loading && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                📋 Residents List: {selectedVillage}, {selectedMandal}
                <span className="badge bg-light text-dark ms-2">
                  {filteredRecords.length} total records
                </span>
              </h5>
              
              {/* Records per page dropdown */}
              <div className="d-flex align-items-center gap-2">
                <label className="mb-0 text-white">Show:</label>
                <select 
                  className="form-select form-select-sm" 
                  style={{ width: 'auto' }}
                  value={recordsPerPage}
                  onChange={handleRecordsPerPageChange}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-white">per page</span>
              </div>
            </div>
          </div>
          
          <div className="card-body p-0">
            {filteredRecords.length === 0 ? (
              <div className="text-center text-muted py-5">
                <h5>No records found</h5>
                <p>There are no residents in {selectedVillage}, {selectedMandal}</p>
              </div>
            ) : (
              <div style={{ maxHeight: "600px", overflowY: "auto", fontSize: "0.85rem" }}>
                <table className="table table-hover table-striped mb-0" style={{ fontSize: "0.85rem" }}>
                  <thead className="table-success sticky-top" style={{ fontSize: "0.85rem" }}>
                    <tr>
                      <th>#</th>
                      <th>Mandal</th>
                      <th>Village</th>
                      <th>Name</th>
                      <th>Members</th>
                      <th>Gender</th>
                      <th>DOB</th>
                      <th>Age</th>
                      <th>Phone</th>
                      <th>Aadhar</th>
                      <th>Address</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((r, index) => (
                      <tr key={r.id}>
                        <td>{indexOfFirstRecord + index + 1}</td>
                        <td>{r.mandalName}</td>
                        <td>{r.villageName}</td>
                        <td>{r.name}</td>
                        <td><span className="badge bg-info">{r.numFamilyPersons}</span></td>
                        <td>{r.gender}</td>
                        <td>{formatDate(r.dateOfBirth)}</td>
                        <td>{calculateAge(r.dateOfBirth)}</td>
                        <td>{r.phoneNumber}</td>
                        <td>{r.aadhar || "-"}</td>
                        <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.address || "-"}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-warning btn-sm" onClick={() => handleEdit(r)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id, r.name)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">
                  Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} records
                </div>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage - 1)}>Previous</button>
                    </li>
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <li key={`ellipsis-${index}`} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      ) : (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => paginate(page)}>{page}</button>
                        </li>
                      )
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage + 1)}>Next</button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Residents;