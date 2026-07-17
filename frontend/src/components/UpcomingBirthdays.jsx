import { useState, useEffect } from 'react';

// ✅ Pure frontend Excel export — no extra library needed (uses CSV fallback)
// For proper .xlsx, install: npm install xlsx
// Then uncomment the xlsx lines below and remove the CSV export function

const UpcomingBirthdays = ({ records: allRecordsFromProps = [] }) => {
  const [allRecords, setAllRecords] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [error, _setError] = useState('');

  // Filter states
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedVillage, setSelectedVillage] = useState(''); // '' means ALL villages in mandal
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);

  // ✅ Update local records when props change
  useEffect(() => {
    setAllRecords(allRecordsFromProps);
    const uniqueMandals = [...new Set(allRecordsFromProps.map(r => r.mandalName))].filter(Boolean).sort();
    setMandals(uniqueMandals);
  }, [allRecordsFromProps]);

  // ─────────────────────────────────────────────
  // CORE: Filter birthdays
  // ─────────────────────────────────────────────
  const filterBirthdays = (records, mandal, village, from, to) => {
    if (!mandal) {
      setBirthdays([]);
      return;
    }

    // IST today
    const now = new Date();
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    const todayYear = istDate.getFullYear();
    const todayMonth = istDate.getMonth();
    const todayDay = istDate.getDate();
    const todayMidnight = new Date(todayYear, todayMonth, todayDay, 0, 0, 0, 0);

    let filtered = records.filter(r => r.mandalName === mandal);
    if (village) {
      filtered = filtered.filter(r => r.villageName === village);
    }

    // Determine date range
    let rangeStart = null;
    let rangeEnd = null;

    if (from && to) {
      rangeStart = new Date(from + 'T00:00:00');
      rangeEnd = new Date(to + 'T23:59:59');
    } else if (from && !to) {
      rangeStart = new Date(from + 'T00:00:00');
      rangeEnd = new Date(from + 'T23:59:59');
    } else if (!from && to) {
      rangeStart = todayMidnight;
      rangeEnd = new Date(to + 'T23:59:59');
    } else {
      // No dates selected → default to next 1 day (today + tomorrow)
      rangeStart = todayMidnight;
      rangeEnd = new Date(todayYear, todayMonth, todayDay + 1, 23, 59, 59, 999);
    }

    const result = filtered.filter(r => {
      if (!r.dateOfBirth) return false;
      const dob = new Date(r.dateOfBirth);
      const birthMonth = dob.getUTCMonth();
      const birthDay = dob.getUTCDate();

      // Try birthday this year and next year
      for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
        const candidateYear = rangeStart.getFullYear() + yearOffset;
        const candidate = new Date(candidateYear, birthMonth, birthDay, 0, 0, 0, 0);
        if (candidate >= rangeStart && candidate <= rangeEnd) {
          return true;
        }
      }
      return false;
    });

    const enriched = result.map(record => {
      const dob = new Date(record.dateOfBirth);
      const birthMonth = dob.getUTCMonth();
      const birthDay = dob.getUTCDate();

      // Find the actual birthday date within range
      let birthdayThisYear = null;
      for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
        const candidateYear = rangeStart.getFullYear() + yearOffset;
        const candidate = new Date(candidateYear, birthMonth, birthDay, 0, 0, 0, 0);
        if (candidate >= rangeStart && candidate <= rangeEnd) {
          birthdayThisYear = candidate;
          break;
        }
      }

      const daysUntil = birthdayThisYear
        ? Math.round((birthdayThisYear - todayMidnight) / (1000 * 60 * 60 * 24))
        : 999;

      const age = birthdayThisYear
        ? birthdayThisYear.getFullYear() - dob.getUTCFullYear()
        : null;

      return {
        ...record,
        daysUntilBirthday: daysUntil,
        upcomingAge: age,
        birthdayDate: birthdayThisYear
          ? birthdayThisYear.toISOString().split('T')[0]
          : null,
      };
    });

    // ✅ Sort by village name first, then by birthday date (village order)
    enriched.sort((a, b) => {
      const villageCompare = (a.villageName || '').localeCompare(b.villageName || '');
      if (villageCompare !== 0) return villageCompare;
      return a.daysUntilBirthday - b.daysUntilBirthday;
    });

    setBirthdays(enriched);
    setCurrentPage(1);
  };

  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────
  const handleMandalChange = (mandal) => {
    setSelectedMandal(mandal);
    setSelectedVillage('');
    setBirthdays([]);

    if (mandal) {
      const filtered = allRecords.filter(r => r.mandalName === mandal);
      const uniqueVillages = [...new Set(filtered.map(r => r.villageName))].filter(Boolean).sort();
      setVillages(uniqueVillages);
      // Auto-load all villages in mandal
      filterBirthdays(allRecords, mandal, '', fromDate, toDate);
    } else {
      setVillages([]);
    }
  };

  const handleVillageChange = (village) => {
    setSelectedVillage(village);
    if (selectedMandal) {
      filterBirthdays(allRecords, selectedMandal, village, fromDate, toDate);
    }
  };

  const handleFromDateChange = (date) => {
    setFromDate(date);
    if (selectedMandal) {
      filterBirthdays(allRecords, selectedMandal, selectedVillage, date, toDate);
    }
  };

  const handleToDateChange = (date) => {
    setToDate(date);
    if (selectedMandal) {
      filterBirthdays(allRecords, selectedMandal, selectedVillage, fromDate, date);
    }
  };

  const resetFilters = () => {
    setSelectedMandal('');
    setSelectedVillage('');
    setFromDate('');
    setToDate('');
    setVillages([]);
    setBirthdays([]);
  };

  // ─────────────────────────────────────────────
  // EXPORT TO EXCEL (CSV → .xlsx compatible)
  // ─────────────────────────────────────────────
  const exportToExcel = () => {
    if (birthdays.length === 0) {
      alert('No birthday records to export.');
      return;
    }

    const headers = [
      'S.No', 'Name', 'Gender', 'Date of Birth', 'Birthday (This Year)',
      'Age (Upcoming)', 'Days Until Birthday', 'Phone Number',
      'Mandal', 'Village', 'Address', 'Aadhar', 'Qualification',
      'Caste', 'Occupation', 'Ration Card', 'Voter Card',
    ];

    const rows = birthdays.map((p, i) => [
      i + 1,
      p.name || '',
      p.gender || '',
      p.dateOfBirth ? formatDate(p.dateOfBirth) : '',
      p.birthdayDate ? formatDate(p.birthdayDate) : '',
      p.upcomingAge != null ? p.upcomingAge : '',
      p.daysUntilBirthday === 0 ? 'Today' : p.daysUntilBirthday === 1 ? 'Tomorrow' : `In ${p.daysUntilBirthday} days`,
      p.phoneNumber || '',
      p.mandalName || '',
      p.villageName || '',
      p.address || '',
      p.aadhar || '',
      p.qualification || '',
      p.caste || '',
      p.occupation || '',
      p.rationCard || '',
      p.voterCard || '',
    ]);

    // Build CSV string
    const escape = (val) => {
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [headers, ...rows]
      .map(row => row.map(escape).join(','))
      .join('\n');

    // Create filename with context
    const mandalLabel = selectedMandal.replace(/\s+/g, '_');
    const villageLabel = selectedVillage ? `_${selectedVillage.replace(/\s+/g, '_')}` : '_AllVillages';
    const dateLabel = fromDate && toDate
      ? `_${fromDate}_to_${toDate}`
      : fromDate ? `_from_${fromDate}` : toDate ? `_to_${toDate}` : '_Next1Day';
    const filename = `Birthdays_${mandalLabel}${villageLabel}${dateLabel}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getUTCDate();
    const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  };

  const getDaysText = (days) => {
    if (days === 0) return 'Today! 🎉';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Passed';
    return `In ${days} days`;
  };

  const getBadgeColor = (days) => {
    if (days === 0) return 'bg-danger';
    if (days <= 3) return 'bg-warning text-dark';
    if (days <= 7) return 'bg-info';
    return 'bg-secondary';
  };

  const getDateRangeLabel = () => {
    if (fromDate && toDate) return `${formatDate(fromDate)} → ${formatDate(toDate)}`;
    if (fromDate) return `From ${formatDate(fromDate)}`;
    if (toDate) return `Up to ${formatDate(toDate)}`;
    return 'Next 1 Day';
  };

  // ─────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentBirthdays = birthdays.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(birthdays.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">❌ {error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid">

      {/* ── FILTER CARD ── */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">🔍 Filter Birthdays</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">

            {/* Mandal */}
            <div className="col-md-3">
              <label className="form-label fw-bold">Select Mandal <span className="text-danger">*</span></label>
              <select
                className="form-select"
                value={selectedMandal}
                onChange={(e) => handleMandalChange(e.target.value)}
              >
                <option value="">-- Select Mandal --</option>
                {mandals.map((mandal) => (
                  <option key={mandal} value={mandal}>{mandal}</option>
                ))}
              </select>
            </div>

            {/* Village (optional — shows All if blank) */}
            <div className="col-md-3">
              <label className="form-label fw-bold">
                Select Village <span className="text-muted fw-normal">(optional — default: All)</span>
              </label>
              <select
                className="form-select"
                value={selectedVillage}
                onChange={(e) => handleVillageChange(e.target.value)}
                disabled={!selectedMandal}
              >
                <option value="">-- All Villages --</option>
                {villages.map((village) => (
                  <option key={village} value={village}>{village}</option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div className="col-md-2">
              <label className="form-label fw-bold">From Date</label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                disabled={!selectedMandal}
              />
            </div>

            {/* To Date */}
            <div className="col-md-2">
              <label className="form-label fw-bold">To Date</label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                disabled={!selectedMandal}
                min={fromDate || undefined}
              />
            </div>

            {/* Reset */}
            <div className="col-md-2 d-flex align-items-end gap-2">
              <button className="btn btn-outline-secondary w-100" onClick={resetFilters} title="Reset all filters">
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Active filters summary */}
          {(selectedMandal || fromDate || toDate) && (
            <div className="alert alert-info mt-3 mb-0 py-2">
              <strong>Active Filters:</strong>
              {selectedMandal && <span className="ms-2">📍 {selectedMandal}</span>}
              {selectedVillage
                ? <span className="ms-2">→ 🏘️ {selectedVillage}</span>
                : selectedMandal && <span className="ms-2 text-muted">→ All Villages</span>
              }
              {(fromDate || toDate) && (
                <span className="ms-2">→ 📅 {getDateRangeLabel()}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── INSTRUCTIONS ── */}
      {!selectedMandal && (
        <div className="alert alert-info">
          <h5 className="alert-heading">🎂 How to View Birthdays</h5>
          <ol className="mb-0">
            <li>Select a <strong>Mandal</strong> — all villages in the mandal will load automatically</li>
            <li>Optionally narrow down by selecting a specific <strong>Village</strong></li>
            <li>Optionally set a <strong>From Date / To Date</strong> range</li>
            <li>Results are shown <strong>village-wise in alphabetical order</strong> with pagination</li>
            <li>Click <strong>Export to Excel</strong> to download all shown records</li>
          </ol>
        </div>
      )}

      {/* ── RESULTS HEADER + EXPORT ── */}
      {selectedMandal && (
        <>
          <div className="row mb-3">
            <div className="col-12">
              <div
                className="card shadow-sm border-0"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                      <h3 className="mb-1">🎂 Birthday Records</h3>
                      <p className="mb-0 opacity-75">
                        {getDateRangeLabel()} — {selectedVillage || `All Villages in ${selectedMandal}`}
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div className="text-end">
                        <h2 className="mb-0">{birthdays.length}</h2>
                        <small>Birthday{birthdays.length !== 1 ? 's' : ''}</small>
                      </div>
                      {/* ✅ Export Button */}
                      <button
                        className="btn btn-warning fw-bold px-4"
                        onClick={exportToExcel}
                        disabled={birthdays.length === 0}
                        title="Export all shown birthdays to Excel/CSV"
                      >
                        📥 Export to Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Per-page selector */}
          {birthdays.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted small">
                Showing {indexOfFirstRecord + 1}–{Math.min(indexOfLastRecord, birthdays.length)} of {birthdays.length} records
                {!selectedVillage && ' (sorted by village)'}
              </span>
              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0 fw-bold small">Per page:</label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={recordsPerPage}
                  onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                  {[10, 25, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── NO RESULTS ── */}
          {birthdays.length === 0 ? (
            <div className="alert alert-warning">
              <strong>ℹ️ No birthdays found</strong><br />
              No birthdays match the selected filters. Try adjusting the date range or village selection.
            </div>
          ) : (
            <>
              {/* ── BIRTHDAY CARDS ── */}
              <div className="row">
                {currentBirthdays.map((person) => (
                  <div key={person.id} className="col-md-6 col-lg-4 col-xl-3 mb-4">
                    <div
                      className="card h-100 shadow-sm border-0 hover-card"
                      style={{ transition: 'transform 0.2s' }}
                    >
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <h6 className="card-title mb-1 text-primary">{person.name}</h6>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                              🏘️ {person.villageName}
                            </p>
                          </div>
                          <span
                            className={`badge ${getBadgeColor(person.daysUntilBirthday)} ms-2`}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {getDaysText(person.daysUntilBirthday)}
                          </span>
                        </div>

                        <div className="mb-2" style={{ fontSize: '0.85rem' }}>
                          <div className="d-flex align-items-center mb-1">
                            <span className="me-2">🎂</span>
                            <strong>Birthday:</strong>
                            <span className="ms-2">{person.birthdayDate ? formatDate(person.birthdayDate) : '—'}</span>
                          </div>
                          <div className="d-flex align-items-center mb-1">
                            <span className="me-2">🎉</span>
                            <strong>Age:</strong>
                            <span className="ms-2">{person.upcomingAge != null ? `${person.upcomingAge} years` : '—'}</span>
                          </div>
                          {person.phoneNumber && (
                            <div className="d-flex align-items-center">
                              <span className="me-2">📞</span>
                              <strong>Phone:</strong>
                              <span className="ms-2">{person.phoneNumber}</span>
                            </div>
                          )}
                        </div>

                        {person.daysUntilBirthday === 0 && (
                          <div className="alert alert-success mb-0 py-1 px-2" style={{ fontSize: '0.75rem' }}>
                            <strong>🎊 Today!</strong>
                          </div>
                        )}
                        {person.daysUntilBirthday === 1 && (
                          <div className="alert alert-warning mb-0 py-1 px-2" style={{ fontSize: '0.75rem' }}>
                            <strong>⏰ Tomorrow!</strong>
                          </div>
                        )}
                      </div>

                      <div className="card-footer bg-light border-0" style={{ fontSize: '0.75rem' }}>
                        <small className="text-muted">
                          {person.gender && `${person.gender}`}
                          {person.mandalName && !selectedVillage && (
                            <span className="ms-2 text-info">• {person.mandalName}</span>
                          )}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── PAGINATION ── */}
              {totalPages > 1 && (
                <div className="card shadow-sm mt-2 mb-4">
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="text-muted small">
                        Page {currentPage} of {totalPages}
                      </div>
                      <nav>
                        <ul className="pagination pagination-sm mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => paginate(1)}>«</button>
                          </li>
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => paginate(currentPage - 1)}>‹ Prev</button>
                          </li>
                          {getPageNumbers().map((page, index) =>
                            page === '...' ? (
                              <li key={`e-${index}`} className="page-item disabled">
                                <span className="page-link">…</span>
                              </li>
                            ) : (
                              <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => paginate(page)}>{page}</button>
                              </li>
                            )
                          )}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => paginate(currentPage + 1)}>Next ›</button>
                          </li>
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => paginate(totalPages)}>»</button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <style>{`
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default UpcomingBirthdays;