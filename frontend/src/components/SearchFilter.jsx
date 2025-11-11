import { useState, useEffect } from 'react';

const SearchFilter = () => {
  const [searchCriteria, setSearchCriteria] = useState({
    name: '',
    mandalName: '',
    villageName: '',
    phoneNumber: '',
    gender: '',
    minAge: '',
    maxAge: '',
    qualification: '',
    occupation: '',
    caste: ''
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  const [qualifications, setQualifications] = useState([]);

  const API_URL = 'https://smart-village-cn6f.onrender.com';

  // Fetch unique mandals and villages for dropdowns
  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await fetch(`${API_URL}/records`);
      const data = await response.json();
      
      const uniqueMandals = [...new Set(data.map(r => r.mandalName).filter(Boolean))];
      const uniqueVillages = [...new Set(data.map(r => r.villageName).filter(Boolean))];
      const uniqueQualifications = [...new Set(data.map(r => r.qualification).filter(Boolean))];
      
      setMandals(uniqueMandals.sort());
      setVillages(uniqueVillages.sort());
      setQualifications(uniqueQualifications.sort());
      
      console.log('Available qualifications in database:', uniqueQualifications);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      Object.keys(searchCriteria).forEach(key => {
        if (searchCriteria[key]) {
          params.append(key, searchCriteria[key]);
        }
      });

      console.log('Searching with params:', params.toString());

      const response = await fetch(`${API_URL}/search?${params.toString()}`);
      const data = await response.json();
      
      console.log('Search results:', data);
      setResults(data);

      if (data.length === 0) {
        alert(`No records found for the given criteria. 

Search parameters used:
${Array.from(params.entries()).map(([key, val]) => `${key}: ${val}`).join('\n')}`);
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchCriteria({
      name: '',
      mandalName: '',
      villageName: '',
      phoneNumber: '',
      gender: '',
      minAge: '',
      maxAge: '',
      qualification: '',
      occupation: '',
      caste: ''
    });
    setResults([]);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="container-fluid">
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">🔍 Advanced Search & Filter</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {/* Name */}
            <div className="col-md-4">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={searchCriteria.name}
                onChange={handleInputChange}
                placeholder="Search by name..."
              />
            </div>

            {/* Mandal */}
            <div className="col-md-4">
              <label className="form-label">Mandal</label>
              <select
                className="form-select"
                name="mandalName"
                value={searchCriteria.mandalName}
                onChange={handleInputChange}
              >
                <option value="">All Mandals</option>
                {mandals.map(mandal => (
                  <option key={mandal} value={mandal}>{mandal}</option>
                ))}
              </select>
            </div>

            {/* Village */}
            <div className="col-md-4">
              <label className="form-label">Village</label>
              <select
                className="form-select"
                name="villageName"
                value={searchCriteria.villageName}
                onChange={handleInputChange}
              >
                <option value="">All Villages</option>
                {villages.map(village => (
                  <option key={village} value={village}>{village}</option>
                ))}
              </select>
            </div>

            {/* Phone Number */}
            <div className="col-md-4">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                name="phoneNumber"
                value={searchCriteria.phoneNumber}
                onChange={handleInputChange}
                placeholder="Search by phone..."
              />
            </div>

            {/* Gender */}
            <div className="col-md-4">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                name="gender"
                value={searchCriteria.gender}
                onChange={handleInputChange}
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Age Range */}
            <div className="col-md-2">
              <label className="form-label">Min Age</label>
              <input
                type="number"
                className="form-control"
                name="minAge"
                value={searchCriteria.minAge}
                onChange={handleInputChange}
                placeholder="Min"
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Max Age</label>
              <input
                type="number"
                className="form-control"
                name="maxAge"
                value={searchCriteria.maxAge}
                onChange={handleInputChange}
                placeholder="Max"
              />
            </div>

            {/* Qualification */}
            <div className="col-md-4">
              <label className="form-label">Qualification</label>
              <select
                className="form-select"
                name="qualification"
                value={searchCriteria.qualification}
                onChange={handleInputChange}
              >
                <option value="">All Qualifications</option>
                {qualifications.map(qual => (
                  <option key={qual} value={qual}>{qual}</option>
                ))}
              </select>
              <small className="text-muted">
                Or type to search: <input 
                  type="text" 
                  className="form-control form-control-sm mt-1" 
                  placeholder="Type qualification..."
                  onChange={(e) => handleInputChange({ target: { name: 'qualification', value: e.target.value }})}
                />
              </small>
            </div>

            {/* Occupation */}
            <div className="col-md-4">
              <label className="form-label">Occupation</label>
              <input
                type="text"
                className="form-control"
                name="occupation"
                value={searchCriteria.occupation}
                onChange={handleInputChange}
                placeholder="Search by occupation..."
              />
            </div>

            {/* Caste */}
            <div className="col-md-4">
              <label className="form-label">Caste</label>
              <input
                type="text"
                className="form-control"
                name="caste"
                value={searchCriteria.caste}
                onChange={handleInputChange}
                placeholder="Search by caste..."
              />
            </div>
          </div>

          <div className="mt-3 d-flex gap-2">
            <button 
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Searching...
                </>
              ) : (
                '🔍 Search'
              )}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleReset}
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">📊 Search Results ({results.length} records found)</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Mandal</th>
                    <th>Village</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Qualification</th>
                    <th>Occupation</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(record => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>{record.name}</td>
                      <td>{record.mandalName}</td>
                      <td>{record.villageName}</td>
                      <td>{record.phoneNumber}</td>
                      <td>{record.gender || 'N/A'}</td>
                      <td>{calculateAge(record.dateOfBirth)}</td>
                      <td>{record.qualification || 'N/A'}</td>
                      <td>{record.occupation || 'N/A'}</td>
                      <td>{record.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="alert alert-info">
          <strong>ℹ️ No results yet.</strong> Use the search filters above to find records.
        </div>
      )}
    </div>
  );
};

export default SearchFilter;