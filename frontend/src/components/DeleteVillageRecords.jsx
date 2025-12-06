import { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const DeleteVillageRecords = () => {
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [villageRecords, setVillageRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [allRecords, setAllRecords] = useState([]);

  useEffect(() => {
    fetchAllRecords();
  }, []);

  const fetchAllRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/records`);
      const data = await response.json();
      setAllRecords(data);
      
      // Extract unique mandals
      const uniqueMandals = [...new Set(data.map(r => r.mandalName))].filter(Boolean).sort();
      setMandals(uniqueMandals);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const handleMandalChange = (mandal) => {
    setSelectedMandal(mandal);
    setSelectedVillage('');
    setVillageRecords([]);
    
    if (mandal) {
      const filtered = allRecords.filter(r => r.mandalName === mandal);
      const uniqueVillages = [...new Set(filtered.map(r => r.villageName))].filter(Boolean).sort();
      setVillages(uniqueVillages);
    } else {
      setVillages([]);
    }
  };

  const handleVillageChange = (village) => {
    setSelectedVillage(village);
    
    if (village && selectedMandal) {
      const filtered = allRecords.filter(
        r => r.mandalName === selectedMandal && r.villageName === village
      );
      setVillageRecords(filtered);
    } else {
      setVillageRecords([]);
    }
  };

  const handleDeleteVillage = async () => {
    if (!selectedVillage) {
      setMessage('⚠️ Please select a village first');
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to DELETE ALL ${villageRecords.length} records from ${selectedVillage}, ${selectedMandal}?\n\nThis action CANNOT be undone!`
    );

    if (!confirmation) return;

    const doubleConfirmation = window.prompt(
      `Type the village name "${selectedVillage}" to confirm deletion:`
    );

    if (doubleConfirmation !== selectedVillage) {
      setMessage('❌ Deletion cancelled - village name did not match');
      return;
    }

    setLoading(true);
    setMessage('🗑️ Deleting records...');

    try {
      const response = await fetch(`${API_URL}/delete-village/${encodeURIComponent(selectedVillage)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Successfully deleted ${data.deletedCount} records from ${selectedVillage}`);
        
        // Refresh data
        await fetchAllRecords();
        setSelectedMandal('');
        setSelectedVillage('');
        setVillageRecords([]);
        setVillages([]);
        
        setTimeout(() => setMessage(''), 5000);
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.error || 'Failed to delete records'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('⚠️ Cannot connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedMandal('');
    setSelectedVillage('');
    setVillageRecords([]);
    setVillages([]);
    setMessage('');
  };

  return (
    <div className="container-fluid">
      {/* Filter Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-warning text-dark">
          <h5 className="mb-0">🔍 Select Village to Delete</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label fw-bold">Select Mandal</label>
              <select
                className="form-select form-select-lg"
                value={selectedMandal}
                onChange={(e) => handleMandalChange(e.target.value)}
              >
                <option value="">-- Select Mandal --</option>
                {mandals.map((mandal) => (
                  <option key={mandal} value={mandal}>{mandal}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-5">
              <label className="form-label fw-bold">Select Village</label>
              <select
                className="form-select form-select-lg"
                value={selectedVillage}
                onChange={(e) => handleVillageChange(e.target.value)}
                disabled={!selectedMandal}
              >
                <option value="">-- Select Village --</option>
                {villages.map((village) => (
                  <option key={village} value={village}>{village}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary btn-lg w-100" onClick={resetSelection}>
                🔄 Reset
              </button>
            </div>
          </div>
          
          {selectedMandal && (
            <div className="alert alert-info mt-3 mb-0">
              <strong>Selected Mandal:</strong> {selectedMandal}
              {selectedVillage && (
                <>
                  <br />
                  <strong>Selected Village:</strong> {selectedVillage}
                  <br />
                  <strong>Total Records:</strong> {villageRecords.length}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Current Village Records Section - Only show when village is selected */}
      {selectedMandal && selectedVillage && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">
              📋 Current Village Records: {selectedVillage}, {selectedMandal}
              <span className="badge bg-light text-dark ms-2">{villageRecords.length} records</span>
            </h5>
          </div>
          <div className="card-body">
            {villageRecords.length > 0 ? (
              <>
                <div className="alert alert-warning">
                  <strong>⚠️ Warning:</strong> You are about to delete {villageRecords.length} records from {selectedVillage}. This action cannot be undone!
                </div>

                <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <table className="table table-striped table-hover table-sm">
                    <thead className="table-dark sticky-top">
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Gender</th>
                        <th>Members</th>
                        <th>Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {villageRecords.map((record, index) => (
                        <tr key={record.id}>
                          <td>{index + 1}</td>
                          <td>{record.name}</td>
                          <td>{record.phoneNumber}</td>
                          <td>{record.gender || 'N/A'}</td>
                          <td><span className="badge bg-info">{record.numFamilyPersons}</span></td>
                          <td>{record.address || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 text-center">
                  <button
                    className="btn btn-danger btn-lg"
                    onClick={handleDeleteVillage}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Deleting...
                      </>
                    ) : (
                      <>🗑️ Delete All {villageRecords.length} Records from {selectedVillage}</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="alert alert-info">
                <strong>ℹ️ No records found</strong> for {selectedVillage} in {selectedMandal}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className={`alert ${
          message.includes('✅') ? 'alert-success' : 
          message.includes('❌') ? 'alert-danger' : 
          message.includes('⚠️') ? 'alert-warning' : 'alert-info'
        } text-center`}>
          {message}
        </div>
      )}

      {/* Instructions */}
      {!selectedMandal && !selectedVillage && (
        <div className="card shadow-sm">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">📝 Instructions</h5>
          </div>
          <div className="card-body">
            <ol className="mb-0">
              <li>First, select a <strong>Mandal</strong> from the dropdown above</li>
              <li>Then, select a <strong>Village</strong> from the filtered list</li>
              <li>Review all records that will be deleted</li>
              <li>Click the delete button and confirm twice to proceed</li>
            </ol>
            <div className="alert alert-danger mt-3 mb-0">
              <strong>⚠️ Important:</strong> This action is permanent and cannot be undone. All records from the selected village will be permanently deleted.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteVillageRecords;