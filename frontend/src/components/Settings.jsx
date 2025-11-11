import { useState } from 'react';

const Settings = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const API_URL = 'https://smart-village-cn6f.onrender.com';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (validTypes.includes(selectedFile.type) || 
          selectedFile.name.endsWith('.xlsx') || 
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setError('');
        setMessage('');
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `✅ Success! 
          - Records imported: ${data.recordsImported}
          - Duplicates skipped: ${data.duplicatesSkipped}
          - Errors: ${data.errors}
          - Total processed: ${data.totalProcessed}`
        );
        setFile(null);
        document.getElementById('file-input').value = '';
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to upload file. Please check your connection.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Import Excel Section */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">📊 Import Excel File</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="file-input" className="form-label">
                  Select Excel File
                </label>
                <input
                  id="file-input"
                  type="file"
                  className="form-control"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>

              {file && (
                <div className="alert alert-info">
                  <strong>Selected:</strong> {file.name} <br />
                  <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
                </div>
              )}

              <button
                className="btn btn-success w-100 mb-3"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Uploading...
                  </>
                ) : (
                  '⬆️ Upload and Process'
                )}
              </button>

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

              <div className="mt-4">
                <h6 className="text-muted">📋 Instructions:</h6>
                <ol className="small text-muted">
                  <li>Select your Excel file (.xlsx or .xls)</li>
                  <li>Click "Upload and Process"</li>
                  <li>Records will be imported to the database</li>
                  <li>Duplicates will be automatically skipped</li>
                </ol>

                <h6 className="text-muted mt-3">📄 Expected Excel Columns:</h6>
                <ul className="small text-muted">
                  <li>MANDAL NAME</li>
                  <li>VILLAGE NAME</li>
                  <li>NAME</li>
                  <li>ADDRESS</li>
                  <li>PHONE NUMBER</li>
                  <li>NUMBER OF FAMILY PERSONS</li>
                  <li>DATE OF BIRTH (DD-MM-YYYY)</li>
                  <li>GENDER, QUALIFICATION, OCCUPATION</li>
                  <li>AADHAR, RATION CARD, VOTER CARD</li>
                  <li>And other optional fields...</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">⚙️ System Information</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6>🔗 API Endpoint:</h6>
                <code className="d-block p-2 bg-light rounded">
                  {API_URL}
                </code>
              </div>

              <div className="mb-3">
                <h6>📊 Database Status:</h6>
                <span className="badge bg-success">✅ Connected</span>
              </div>

              <div className="mb-3">
                <h6>🌐 Frontend URL:</h6>
                <code className="d-block p-2 bg-light rounded">
                  https://smart-village1.netlify.app
                </code>
              </div>

              <div className="mb-3">
                <h6>📦 Features:</h6>
                <ul className="list-unstyled">
                  <li>✅ Excel Import with Duplicate Detection</li>
                  <li>✅ Birthday Tracking (Week/Month)</li>
                  <li>✅ Village & Mandal Filtering</li>
                  <li>✅ Family Records Management</li>
                  <li>✅ Statistics Dashboard</li>
                </ul>
              </div>

              <hr />

              <div className="alert alert-warning small">
                <strong>⚠️ Note:</strong> Uploading a new Excel file will check for duplicates 
                and only import new records. Existing records will remain unchanged.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;