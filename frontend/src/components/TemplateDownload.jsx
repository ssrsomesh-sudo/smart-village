import { useState } from 'react';
import { API_URL } from '../config/api';

const TemplateDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState(null);
  
  //const API_URL = 'https://smart-village-cn6f.onrender.com';

  const downloadTemplate = async () => {
    try {
      setDownloading(true);
      setError(null);
      
      console.log('Requesting template from:', `${API_URL}/download-template`);
      
      const response = await fetch(`${API_URL}/download-template`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'bytes');
      console.log('Blob type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Smart-Village-Template.xlsx';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
      
    } catch (error) {
      console.error('Error downloading template:', error);
      setError(error.message || 'Failed to download template. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          
          {/* Main Card */}
          <div className="card shadow-lg mb-4">
            <div className="card-header bg-success text-white text-center">
              <h3 className="mb-0">📊 Download Excel Template</h3>
            </div>
            <div className="card-body p-5">
              
              {/* Icon */}
              <div className="text-center mb-4">
                <div className="d-inline-block bg-success bg-opacity-10 p-4 rounded-circle">
                  <span style={{ fontSize: '4rem' }}>📋</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-center text-muted mb-4 fs-5">
                Get the standardized Excel template with all required columns pre-formatted. 
                Fill in your data and upload it back to avoid any formatting issues.
              </p>

              {/* Download Button */}
              <div className="text-center mb-4">
                <button
                  onClick={downloadTemplate}
                  disabled={downloading}
                  className={`btn btn-lg px-5 py-3 ${
                    downloading 
                      ? 'btn-secondary' 
                      : downloaded
                      ? 'btn-success'
                      : 'btn-primary'
                  }`}
                  style={{ minWidth: '250px' }}
                >
                  {downloading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Downloading...
                    </>
                  ) : downloaded ? (
                    <>
                      ✅ Downloaded!
                    </>
                  ) : (
                    <>
                      📥 Download Template
                    </>
                  )}
                </button>
              </div>

              {/* Success Message */}
              {downloaded && (
                <div className="alert alert-success text-center">
                  <strong>✅ Template downloaded successfully!</strong><br />
                  Check your downloads folder for "Smart-Village-Template.xlsx"
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger text-center">
                  <strong>❌ Error:</strong><br />
                  {error}
                  <br />
                  <small className="mt-2 d-block">
                    Please check your internet connection or contact support if the issue persists.
                  </small>
                </div>
              )}

              {/* Debug Info (for development) */}
              {error && (
                <div className="mt-3 text-center">
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      console.log('Testing API connection...');
                      fetch(`${API_URL}/`)
                        .then(r => r.json())
                        .then(data => {
                          console.log('API is reachable:', data);
                          alert('API is reachable! Check console for details.');
                        })
                        .catch(err => {
                          console.error('API connection failed:', err);
                          alert('Cannot reach API server. Check console for details.');
                        });
                    }}
                  >
                    Test API Connection
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Instructions Card */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">ℹ️ Template Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-bold">📋 Template Includes:</h6>
                  <ul className="list-unstyled">
                    <li>✓ All 20 required column headers</li>
                    <li>✓ Sample data row for reference</li>
                    <li>✓ Proper column formatting</li>
                    <li>✓ Date format guide (DD-MM-YYYY)</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold">📝 How to use:</h6>
                  <ol>
                    <li>Download the template file</li>
                    <li>Delete the sample row</li>
                    <li>Fill in your family records data</li>
                    <li>Save and upload the file</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Required Fields */}
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">⚠️ Required Fields</h5>
            </div>
            <div className="card-body">
              <p className="mb-2">
                <strong>The following fields are mandatory:</strong>
              </p>
              <div className="row">
                <div className="col-md-6">
                  <ul>
                    <li><strong>MANDAL NAME</strong></li>
                    <li><strong>VILLAGE NAME</strong></li>
                    <li><strong>NAME</strong></li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <ul>
                    <li><strong>ADDRESS</strong></li>
                    <li><strong>PHONE NUMBER</strong></li>
                  </ul>
                </div>
              </div>
              <div className="alert alert-warning mb-0 mt-2">
                <small>
                  ℹ️ Records missing these required fields will be skipped during upload.
                </small>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TemplateDownload;