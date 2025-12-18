import { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const BulkDeleteUtility = ({ records = [], refreshData }) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchPattern, setSearchPattern] = useState('');
  const [matchingRecords, setMatchingRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteCount, setDeleteCount] = useState(0);
  const [searching, setSearching] = useState(false);
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);

  // ✅ Debounced search
  useEffect(() => {
    setSearching(true);
    const timer = setTimeout(() => {
      setSearchPattern(searchInput);
      setSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Find matching records
  useEffect(() => {
    if (!searchPattern || searchPattern.trim() === '') {
      setMatchingRecords([]);
      setSelectedRecords([]);
      setCurrentPage(1);
      return;
    }

    if (searchPattern.trim().length < 2) {
      setMatchingRecords([]);
      setSelectedRecords([]);
      return;
    }

    const matches = records.filter(r => 
      r.villageName && r.villageName.toUpperCase().startsWith(searchPattern.toUpperCase())
    );
    setMatchingRecords(matches);
    setSelectedRecords(matches.map(r => r.id));
    setCurrentPage(1); // Reset to first page on new search
  }, [searchPattern, records]);

  // ✅ Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = matchingRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(matchingRecords.length / recordsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleRecordsPerPageChange = (e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
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

  const handleSelectAll = () => {
    if (selectedRecords.length === matchingRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(matchingRecords.map(r => r.id));
    }
  };

  const handleSelectPageRecords = () => {
    const currentPageIds = currentRecords.map(r => r.id);
    const allCurrentSelected = currentPageIds.every(id => selectedRecords.includes(id));
    
    if (allCurrentSelected) {
      // Deselect all on current page
      setSelectedRecords(selectedRecords.filter(id => !currentPageIds.includes(id)));
    } else {
      // Select all on current page
      const newSelected = [...new Set([...selectedRecords, ...currentPageIds])];
      setSelectedRecords(newSelected);
    }
  };

  const handleSelectRecord = (id) => {
    if (selectedRecords.includes(id)) {
      setSelectedRecords(selectedRecords.filter(rid => rid !== id));
    } else {
      setSelectedRecords([...selectedRecords, id]);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchPattern('');
    setMatchingRecords([]);
    setSelectedRecords([]);
    setMessage('');
    setCurrentPage(1);
  };

  const handleQuickSearch = (pattern) => {
    setSearchInput(pattern);
    setSearchPattern(pattern);
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) {
      setMessage('⚠️ No records selected');
      return;
    }

    const confirmation = window.confirm(
      `🗑️ Are you sure you want to DELETE ${selectedRecords.length} records?\n\n` +
      `This will permanently delete all selected records with village names starting with "${searchPattern}"\n\n` +
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

    if (refreshData) {
      setTimeout(() => {
        refreshData();
        handleClearSearch();
      }, 1500);
    }
  };

  const areAllCurrentPageSelected = currentRecords.length > 0 && 
    currentRecords.every(r => selectedRecords.includes(r.id));

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
              <div className="input-group input-group-lg">
                <input
                  type="text"
                  className="form-control"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g., GUDURU or TAILORS COLONY-"
                />
                {searchInput && (
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={handleClearSearch}
                    type="button"
                  >
                    ❌ Clear
                  </button>
                )}
              </div>
              <small className="text-muted">
                {searching ? (
                  <span className="text-primary">
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Searching...
                  </span>
                ) : (
                  <>Type at least 2 characters. Search waits 0.5 seconds after you stop typing.</>
                )}
              </small>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <div className={`card w-100 ${matchingRecords.length > 0 ? 'bg-danger' : 'bg-secondary'} text-white`}>
                <div className="card-body text-center">
                  <h3 className="mb-0">{matchingRecords.length}</h3>
                  <small>Records Found</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!searchPattern && (
        <div className="alert alert-info">
          <h5 className="alert-heading">ℹ️ How to use this tool:</h5>
          <ol className="mb-3">
            <li><strong>Enter a search pattern</strong> in the box above (minimum 2 characters)</li>
            <li><strong>Wait 0.5 seconds</strong> for the search to complete</li>
            <li><strong>Review the matching records</strong> (use pagination for large results)</li>
            <li><strong>Select/deselect</strong> records as needed</li>
            <li><strong>Click delete</strong> and confirm twice to proceed</li>
          </ol>
          <p className="mb-0">
            <strong>⚠️ Warning:</strong> Deleted records cannot be recovered!
          </p>
        </div>
      )}

      {/* Minimum characters warning */}
      {searchPattern && searchPattern.trim().length < 2 && (
        <div className="alert alert-warning">
          <p className="mb-0">⚠️ Please enter at least 2 characters to search</p>
        </div>
      )}

      {/* Matching Records with Pagination */}
      {matchingRecords.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-danger text-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">
                📋 Step 2: Review Records ({selectedRecords.length}/{matchingRecords.length} selected)
              </h5>
              <div className="d-flex gap-2 align-items-center">
                <button 
                  className="btn btn-light btn-sm"
                  onClick={handleSelectPageRecords}
                >
                  {areAllCurrentPageSelected ? 'Deselect Page' : 'Select Page'}
                </button>
                <button 
                  className="btn btn-light btn-sm"
                  onClick={handleSelectAll}
                >
                  {selectedRecords.length === matchingRecords.length ? 'Deselect All' : 'Select All'}
                </button>
                <select 
                  className="form-select form-select-sm" 
                  style={{ width: 'auto' }}
                  value={recordsPerPage}
                  onChange={handleRecordsPerPageChange}
                >
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                  <option value={200}>200 per page</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="card-body p-0">
            <div style={{ maxHeight: "500px", overflowY: "auto" }}>
              <table className="table table-sm table-hover mb-0">
                <thead className="table-dark sticky-top">
                  <tr>
                    <th style={{ width: "50px" }}>
                      <input
                        type="checkbox"
                        checked={areAllCurrentPageSelected}
                        onChange={handleSelectPageRecords}
                        title="Select/Deselect current page"
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
                  {currentRecords.map((record, index) => (
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
                      <td>{indexOfFirstRecord + index + 1}</td>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">
                  Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, matchingRecords.length)} of {matchingRecords.length} records
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

      {/* Delete Button */}
      {matchingRecords.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">🗑️ Step 3: Delete Selected Records</h5>
          </div>
          <div className="card-body text-center">
            <p className="text-danger fw-bold mb-3">
              ⚠️ You are about to delete {selectedRecords.length} records out of {matchingRecords.length} found. This cannot be undone!
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

      {/* No results */}
      {matchingRecords.length === 0 && searchPattern && searchPattern.trim().length >= 2 && !searching && (
        <div className="alert alert-warning">
          <h5 className="alert-heading">⚠️ No records found</h5>
          <p className="mb-0">
            No records found with village name starting with "<strong>{searchPattern}</strong>". 
            Try a different search pattern or click one of the examples below.
          </p>
        </div>
      )}

      {/* Quick Patterns */}
      <div className="card shadow-sm">
        <div className="card-header bg-secondary text-white">
          <h5 className="mb-0">💡 Quick Search Patterns</h5>
        </div>
        <div className="card-body">
          <p className="mb-2">Click a pattern to instantly search:</p>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => handleQuickSearch('TAILORS COLONY-')}>
              TAILORS COLONY-
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => handleQuickSearch('GUDURU')}>
              GUDURU
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => handleQuickSearch('TEST')}>
              TEST
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => handleQuickSearch('DUMMY')}>
              DUMMY
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => handleQuickSearch('SAMPLE')}>
              SAMPLE
            </button>
            {searchInput && (
              <button className="btn btn-outline-danger btn-sm" onClick={handleClearSearch}>
                ❌ Clear Search
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteUtility;