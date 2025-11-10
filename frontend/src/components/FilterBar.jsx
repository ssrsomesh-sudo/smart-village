function FilterBar({ 
  mandals, 
  villages, 
  selectedMandal, 
  selectedVillage, 
  onMandalChange, 
  onVillageChange, 
  onReset 
}) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">🔍 Filter Records</h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-5">
            <label className="form-label fw-bold">Select Mandal</label>
            <select
              className="form-select form-select-lg"
              value={selectedMandal}
              onChange={(e) => onMandalChange(e.target.value)}
            >
              <option value="">-- All Mandals --</option>
              {mandals.map((mandal) => (
                <option key={mandal} value={mandal}>
                  {mandal}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <label className="form-label fw-bold">Select Village</label>
            <select
              className="form-select form-select-lg"
              value={selectedVillage}
              onChange={(e) => onVillageChange(e.target.value)}
              disabled={!selectedMandal}
            >
              <option value="">-- All Villages --</option>
              {villages.map((village) => (
                <option key={village} value={village}>
                  {village}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-outline-secondary btn-lg w-100" onClick={onReset}>
              🔄 Reset
            </button>
          </div>
        </div>
        
        {(selectedMandal || selectedVillage) && (
          <div className="alert alert-info mt-3 mb-0">
            <strong>Filtered:</strong>
            {selectedMandal && ` Mandal: ${selectedMandal}`}
            {selectedVillage && ` → Village: ${selectedVillage}`}
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterBar;