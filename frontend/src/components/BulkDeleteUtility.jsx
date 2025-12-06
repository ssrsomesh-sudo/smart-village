import { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const BulkDeleteUtility = ({ records = [], refreshData }) => {
  const [searchPattern, setSearchPattern] = useState('TAILORS COLONY-');
  const [matchingRecords, setMatchingRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteCount, setDeleteCount] = useState(0);

  // Find matching records
  useEffect(() => {
    if (!searchPattern) {
      setMatchingRecords([]);
      return;
    }

    const matches = records.filter(r => 
      r.villageName && r.villageName.startsWith(searchPattern)
    );
    setMatchingRecords(matches);
    // Auto-select all matches
    setSelectedRecords(matches.map(r => r.id));
  }, [searchPattern, records]);

  const handleSelectAll = () => {
    if (selectedRecords.length === matchingRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(matchingRecords.map(r => r.id));
    }
  };

  const handleSelectRecord = (id) => {
    if (selectedRecords.includes(id)) {
      setSelectedRecords(selectedRecords.filter(rid => rid !== id));
    } else {
      setSelectedRecords([...selectedRecords, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) {
      setMessage('⚠️ No records selected');
      return;
    }

    const confirmation = window.confirm(
      `🗑️ Are you sure you want to DELETE ${selectedRecords.length} records?\n\n` +
      `This will permanently delete all records with village names starting with "${searchPattern}"\n\n` +
      `This action CANNOT be undone!`
    );

    if (!confirmation) return;

    const doubleConfirmation = window.prompt(
      `Type "DELETE ${selectedRecords.length} RECORDS" to confirm:`
    );

    if (doubleConfirmation !== `DELETE ${selectedRecords.length} RECORDS`) {
      setMessage('❌ Deletion cancelled - confirmation text did not match');
      return;
    }

    setDeleting(true);
    setMessage(`🗑️ Deleting ${selectedRecords.length} records...`);
    setDeleteCount(0);

    let successCount = 0;
    let errorCount = 0;

    for (const recordId of selectedRecords) {
      try {
        const response = await fetch(`${API_URL}/records/${recordId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          successCount++;
          setDeleteCount(successCount);
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error deleting record ${recordId}:`, error);
        errorCount++;
      }
    }

    setDeleting(false);
    setMessage(
      `✅ Deleted ${successCount} records successfully!` +
      (errorCount > 0 ? ` (${errorCount} failed)` : '')
    );

    // Refresh data
    if (refreshData) {
      setTimeout(() => {
        refreshData();
        setSelectedRecords([]);
      }, 1500);
    }
  };

  return (
    <div className="container-fluid">
      <div className="alert alert-danger mb-4">
        <h5 className="alert-heading">⚠️ Bulk Delete Utility - Use with Caution!</h5>
        <p className="mb-0">
          This tool allows you to delete multiple records at once. 
          <strong> Please be very careful as this action cannot be undone.</strong>
        </p>
      </div>

      {/* Search Pattern */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-warning text-dark">
          <h5 className="mb-0">🔍 Step 1: Find Records to Delete</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <label className="form-label fw-bold">Search for Village Names Starting With:</label>
              <input
                type="text"
                className="form-control form-control-lg"
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value)}
                placeholder="e.g., TAILORS COLONY-"
              />
              <small className="text-muted">
                This will find all records where village name starts with this text
              </small>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <div className="card w-100 bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{matchingRecords.length}</h3>
                  <small>Records Found</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matching Records */}
      {matchingRecords.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-danger text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                📋 Step 2: Review Records ({selectedRecords.length} selected)
              </h5>
              <button 
                className="btn btn-light btn-sm"
                onClick={handleSelectAll}
              >
                {selectedRecords.length === matchingRecords.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table className="table table-sm table-hover mb-0">
                <thead className="table-dark sticky-top">
                  <tr>
                    <th style={{ width: "50px" }}>
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === matchingRecords.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>#</th>
                    <th>Mandal</th>
                    <th>Village Name</th>
                    <th>Person Name</th>
                    <th>Phone</th>
                    <th>Members</th>
                  </tr>
                </thead>
                <tbody>
                  {matchingRecords.map((record, index) => (
                    <tr 
                      key={record.id}
                      className={selectedRecords.includes(record.id) ? 'table-danger' : ''}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record.id)}
                          onChange={() => handleSelectRecord(record.id)}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td>{record.mandalName}</td>
                      <td>
                        <strong className="text-danger">{record.villageName}</strong>
                      </td>
                      <td>{record.name}</td>
                      <td>{record.phoneNumber}</td>
                      <td><span className="badge bg-info">{record.numFamilyPersons}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Button */}
      {matchingRecords.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">🗑️ Step 3: Delete Selected Records</h5>
          </div>
          <div className="card-body text-center">
            <p className="text-danger fw-bold mb-3">
              ⚠️ You are about to delete {selectedRecords.length} records. This cannot be undone!
            </p>
            
            <button
              className="btn btn-danger btn-lg"
              onClick={handleBulkDelete}
              disabled={deleting || selectedRecords.length === 0}
            >
              {deleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Deleting {deleteCount}/{selectedRecords.length}...
                </>
              ) : (
                <>🗑️ Delete {selectedRecords.length} Selected Records</>
              )}
            </button>
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
          <h5>{message}</h5>
        </div>
      )}

      {/* Instructions */}
      {matchingRecords.length === 0 && searchPattern && (
        <div className="alert alert-info">
          <h5 className="alert-heading">ℹ️ No records found</h5>
          <p className="mb-0">
            No records found with village name starting with "<strong>{searchPattern}</strong>". 
            Try a different search pattern.
          </p>
        </div>
      )}

      {/* Common Patterns */}
      <div className="card shadow-sm">
        <div className="card-header bg-secondary text-white">
          <h5 className="mb-0">💡 Common Search Patterns</h5>
        </div>
        <div className="card-body">
          <p className="mb-2">Click a pattern to search:</p>
          <div className="d-flex flex-wrap gap-2">
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setSearchPattern('TAILORS COLONY-')}
            >
              TAILORS COLONY-
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setSearchPattern('TEST')}
            >
              TEST
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setSearchPattern('DUMMY')}
            >
              DUMMY
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setSearchPattern('SAMPLE')}
            >
              SAMPLE
            </button>
          </div>
          
          <hr />
          
          <h6>How to use:</h6>
          <ol className="mb-0">
            <li>Enter the starting text of village names you want to delete</li>
            <li>Review the matching records carefully</li>
            <li>Select/deselect records as needed</li>
            <li>Click delete and confirm twice</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteUtility;