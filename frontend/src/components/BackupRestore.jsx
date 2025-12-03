import { useState } from 'react';
import { API_URL } from '../config/api';
const BackupRestore = () => {
  const [backupFile, setBackupFile] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  //const API_URL = 'https://smart-village-cn6f.onrender.com';

  // Export/Download Backup
  const handleExportBackup = async () => {
    try {
      setMessage('Creating backup...');
      setError('');

      const response = await fetch(`${API_URL}/backup/export`);
      
      if (!response.ok) {
        throw new Error('Failed to export backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-village-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage('✅ Backup downloaded successfully!');
    } catch (err) {
      setError('Failed to export backup: ' + err.message);
      console.error('Export error:', err);
    }
  };

  // Handle file selection for restore
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        setBackupFile(selectedFile);
        setError('');
        setMessage('');
      } else {
        setError('Please select a valid JSON backup file');
        setBackupFile(null);
      }
    }
  };

  // Restore from backup
  const handleRestore = async () => {
    if (!backupFile) {
      setError('Please select a backup file first');
      return;
    }

    const confirmRestore = window.confirm(
      '⚠️ WARNING: This will restore data from the backup file.\n\n' +
      'Existing records with the same details will be skipped.\n' +
      'New records from the backup will be added.\n\n' +
      'Do you want to continue?'
    );

    if (!confirmRestore) {
      return;
    }

    setRestoring(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', backupFile);

    try {
      const response = await fetch(`${API_URL}/backup/restore`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `✅ Restore completed!\n` +
          `- Restored: ${data.restoredRecords} records\n` +
          `- Skipped duplicates: ${data.skippedDuplicates}\n` +
          `- Errors: ${data.errors}\n` +
          `- Total in backup: ${data.totalInBackup}`
        );
        setBackupFile(null);
        document.getElementById('restore-file-input').value = '';
      } else {
        setError(data.error || 'Restore failed');
      }
    } catch (err) {
      setError('Failed to restore backup: ' + err.message);
      console.error('Restore error:', err);
    } finally {
      setRestoring(false);
    }
  };

  // Schedule automatic backup reminder
  const setupAutoBackupReminder = () => {
    alert(
      '💡 Backup Reminder Setup:\n\n' +
      '1. Set a monthly calendar reminder\n' +
      '2. Export backup on the 1st of each month\n' +
      '3. Store backups in a safe location (Google Drive, Dropbox, etc.)\n' +
      '4. Keep at least 3 months of backups\n\n' +
      'This ensures your data is always safe!'
    );
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Export Backup Section */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">💾 Export Backup</h5>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Download a complete backup of all your family records data.
                This creates a JSON file that can be used to restore data later.
              </p>

              <button
                className="btn btn-success btn-lg w-100 mb-3"
                onClick={handleExportBackup}
              >
                📥 Download Backup Now
              </button>

              <div className="alert alert-info">
                <strong>💡 Backup Best Practices:</strong>
                <ul className="mb-0 mt-2">
                  <li>Export backup monthly (1st of each month)</li>
                  <li>Store in multiple safe locations</li>
                  <li>Keep at least 3 months of backups</li>
                  <li>Test restore process occasionally</li>
                </ul>
              </div>

              <button
                className="btn btn-outline-primary w-100"
                onClick={setupAutoBackupReminder}
              >
                🔔 Set Up Backup Reminder
              </button>
            </div>
          </div>
        </div>

        {/* Restore Backup Section */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">📤 Restore from Backup</h5>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Restore data from a previously exported backup file.
                Duplicate records will be automatically skipped.
              </p>

              <div className="mb-3">
                <label htmlFor="restore-file-input" className="form-label">
                  Select Backup File (JSON)
                </label>
                <input
                  id="restore-file-input"
                  type="file"
                  className="form-control"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={restoring}
                />
              </div>

              {backupFile && (
                <div className="alert alert-info">
                  <strong>Selected:</strong> {backupFile.name} <br />
                  <strong>Size:</strong> {(backupFile.size / 1024).toFixed(2)} KB
                </div>
              )}

              <button
                className="btn btn-warning btn-lg w-100 mb-3"
                onClick={handleRestore}
                disabled={!backupFile || restoring}
              >
                {restoring ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Restoring...
                  </>
                ) : (
                  '♻️ Restore Backup'
                )}
              </button>

              <div className="alert alert-warning">
                <strong>⚠️ Important Notes:</strong>
                <ul className="mb-0 mt-2">
                  <li>Existing records won't be deleted</li>
                  <li>Duplicates are automatically skipped</li>
                  <li>New records from backup will be added</li>
                  <li>Process may take a few minutes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

{/* Download Template Section */}
<div className="row mb-4">
  <div className="col-12">
    <div className="card shadow-sm border-info">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">📥 Excel Upload Template</h5>
      </div>
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h6>Need to upload new family records?</h6>
            <p className="text-muted mb-0">
              Download our Excel template with all the correct column headers. 
              This ensures your data uploads successfully without formatting errors.
            </p>
          </div>
          <div className="col-md-4 text-md-end">
            <button
              className="btn btn-info btn-lg"
              onClick={() => window.open(`${API_URL}/download-template`, '_blank')}
            >
              📥 Download Template
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
      {/* Status Messages */}
      {message && (
        <div className="alert alert-success" style={{ whiteSpace: 'pre-line' }}>
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          ❌ {error}
        </div>
      )}

      {/* Backup Schedule Guide */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">📅 Recommended Backup Schedule</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <h6>🗓️ Daily (High Activity)</h6>
                  <p className="small text-muted">
                    If you're actively adding/updating records daily, 
                    export backup at end of each day.
                  </p>
                </div>
                <div className="col-md-4">
                  <h6>📆 Weekly (Regular Use)</h6>
                  <p className="small text-muted">
                    For regular usage, export backup every Friday evening 
                    or Sunday night.
                  </p>
                </div>
                <div className="col-md-4">
                  <h6>📊 Monthly (Standard)</h6>
                  <p className="small text-muted">
                    Minimum recommended: Export backup on 1st of each month 
                    and store safely.
                  </p>
                </div>
              </div>

              <hr />

              <h6>📁 Where to Store Backups:</h6>
              <div className="row">
                <div className="col-md-3">
                  <div className="text-center p-3 border rounded">
                    <div className="fs-3">☁️</div>
                    <strong>Cloud Storage</strong>
                    <p className="small text-muted mb-0">
                      Google Drive, Dropbox, OneDrive
                    </p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 border rounded">
                    <div className="fs-3">💻</div>
                    <strong>Local Computer</strong>
                    <p className="small text-muted mb-0">
                      Desktop, Documents folder
                    </p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 border rounded">
                    <div className="fs-3">💾</div>
                    <strong>External Drive</strong>
                    <p className="small text-muted mb-0">
                      USB drive, External HDD
                    </p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 border rounded">
                    <div className="fs-3">📧</div>
                    <strong>Email</strong>
                    <p className="small text-muted mb-0">
                      Send to yourself as attachment
                    </p>
                  </div>
                </div>
              </div>

              <div className="alert alert-success mt-3 mb-0">
                <strong>✅ Best Practice:</strong> Use the 3-2-1 backup rule - 
                Keep 3 copies, on 2 different storage types, with 1 offsite (cloud).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;