import { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
const DeleteVillageRecords = () => {
  const [villages, setVillages] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  //const API_URL = 'https://smart-village-cn6f.onrender.com';

  useEffect(() => {
    fetchVillages();
  }, []);

  const fetchVillages = async () => {
    try {
      const response = await fetch(`${API_URL}/records`);
      const data = await response.json();
      
      // Get unique villages with count
      const villageMap = {};
      data.forEach(record => {
        const village = record.villageName;
        if (village) {
          villageMap[village] = (villageMap[village] || 0) + 1;
        }
      });

      const villageList = Object.entries(villageMap).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => a.name.localeCompare(b.name));

      setVillages(villageList);
    } catch (error) {
      console.error('Error fetching villages:', error);
      setError('Failed to load villages');
    }
  };

  const handleVillageChange = (e) => {
    const village = e.target.value;
    setSelectedVillage(village);
    
    const villageData = villages.find(v => v.name === village);
    setRecordCount(villageData ? villageData.count : 0);
    setMessage('');
    setError('');
  };

  const handleDelete = async () => {
    if (!selectedVillage) {
      setError('Please select a village first');
      return;
    }

    const confirmMsg = `⚠️ WARNING: Delete All Records from ${selectedVillage}?\n\n` +
      `This will permanently delete ${recordCount} record(s).\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Are you sure you want to continue?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    const doubleConfirm = window.confirm(
      `🚨 FINAL CONFIRMATION!\n\n` +
      `You are about to DELETE ${recordCount} records from ${selectedVillage}.\n\n` +
      `Click OK to DELETE, or Cancel to abort.`
    );

    if (!doubleConfirm) {
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_URL}/delete-village/${encodeURIComponent(selectedVillage)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Successfully deleted ${data.deletedCount} records from ${selectedVillage}`);
        setSelectedVillage('');
        setRecordCount(0);
        // Refresh village list
        fetchVillages();
      } else {
        setError(data.error || 'Failed to delete records');
      }
    } catch (err) {
      setError('Failed to delete records. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card shadow-sm">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">🗑️ Delete Village Records</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-warning">
                <strong>⚠️ Warning:</strong> This will permanently delete ALL records 
                from the selected village. Make sure you have a backup first!
              </div>

              {/* Village Selection */}
              <div className="mb-4">
                <label className="form-label">
                  <strong>Select Village to Delete:</strong>
                </label>
                <select
                  className="form-select form-select-lg"
                  value={selectedVillage}
                  onChange={handleVillageChange}
                  disabled={loading}
                >
                  <option value="">-- Choose a Village --</option>
                  {villages.map(village => (
                    <option key={village.name} value={village.name}>
                      {village.name} ({village.count} records)
                    </option>
                  ))}
                </select>
              </div>

              {/* Record Count Display */}
              {selectedVillage && (
                <div className="alert alert-info mb-4">
                  <h6 className="mb-2">Selected Village:</h6>
                  <p className="mb-1">
                    <strong>Village:</strong> {selectedVillage}
                  </p>
                  <p className="mb-0">
                    <strong>Total Records:</strong> {recordCount}
                  </p>
                </div>
              )}

              {/* Delete Button */}
              <button
                className="btn btn-danger btn-lg w-100 mb-3"
                onClick={handleDelete}
                disabled={!selectedVillage || loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Deleting...
                  </>
                ) : (
                  `🗑️ Delete All Records from ${selectedVillage || 'Selected Village'}`
                )}
              </button>

              {/* Messages */}
              {message && (
                <div className="alert alert-success">
                  {message}
                </div>
              )}

              {error && (
                <div className="alert alert-danger">
                  ❌ {error}
                </div>
              )}

              {/* Village List */}
              <div className="mt-4">
                <h6 className="text-muted">📊 Current Villages:</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>Village Name</th>
                        <th className="text-end">Record Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {villages.map(village => (
                        <tr key={village.name}>
                          <td>{village.name}</td>
                          <td className="text-end">{village.count}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-primary">
                        <th>Total Villages</th>
                        <th className="text-end">{villages.length}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Instructions */}
              <div className="alert alert-light mt-4">
                <h6>📋 Instructions:</h6>
                <ol className="mb-0 small">
                  <li>Select the village you want to delete from the dropdown</li>
                  <li>Review the number of records that will be deleted</li>
                  <li>Click the delete button</li>
                  <li>Confirm the action twice (safety measure)</li>
                  <li>Records will be permanently deleted</li>
                </ol>
              </div>

              {/* Safety Tips */}
              <div className="alert alert-info mt-3 mb-0">
                <h6>💡 Safety Tips:</h6>
                <ul className="mb-0 small">
                  <li><strong>Backup First:</strong> Always download a backup before deleting</li>
                  <li><strong>Double Check:</strong> Make sure you selected the correct village</li>
                  <li><strong>No Undo:</strong> Deleted records cannot be recovered</li>
                  <li><strong>Alternative:</strong> Consider exporting village data before deletion</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteVillageRecords;