import { useState, useEffect } from 'react';

const UpcomingBirthdays = ({ records: allRecordsFromProps = [] }) => {
  const [allRecords, setAllRecords] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  
  // Filter states
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 12;

  useEffect(() => {
    setAllRecords(allRecordsFromProps);
    const uniqueMandals = [...new Set(allRecordsFromProps.map(r => r.mandalName))].filter(Boolean).sort();
    setMandals(uniqueMandals);
  }, [allRecordsFromProps]);

  // ✅ Get IST date
  const getTodayIST = () => {
    const now = new Date();
    const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istString);
    istDate.setHours(0, 0, 0, 0);
    return istDate;
  };

  // ✅ Extract calendar date from stored UTC date string
  const extractCalendarDate = (dateString) => {
    if (!dateString) return null;
    
    const stored = new Date(dateString);
    const year = stored.getUTCFullYear();
    const month = stored.getUTCMonth();
    const day = stored.getUTCDate();
    
    return { year, month, day };
  };

  // ✅ Filter birthdays with proper calendar date comparison
  const filterBirthdays = (records, mandal, village, daysAhead = null, specificDate = null) => {
    if (!mandal || !village) {
      setBirthdays([]);
      return;
    }

    let filtered = records;

    // Filter by mandal and village
    filtered = filtered.filter(r => r.mandalName === mandal);
    filtered = filtered.filter(r => r.villageName === village);

    // Get today's date in IST
    const today = getTodayIST();
    const todayYear = today.getFullYear();
    //const todayMonth = today.getMonth();
    //const todayDay = today.getDate();

    //console.log("=== BIRTHDAY FILTERING DEBUG ===");
    //console.log("Today (IST):", today.toDateString(), `Y:${todayYear} M:${todayMonth} D:${todayDay}`);

    // Filter by date or days ahead
    const result = filtered.filter(r => {
      if (!r.dateOfBirth) return false;

      const birthCalendar = extractCalendarDate(r.dateOfBirth);
      if (!birthCalendar) return false;

      if (specificDate) {
        const targetDate = new Date(specificDate);
        targetDate.setHours(0, 0, 0, 0);
        //const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();
        const targetDay = targetDate.getDate();

        const matches = (birthCalendar.month === targetMonth && birthCalendar.day === targetDay);
        
        //console.log(`${r.name}: Birth M:${birthCalendar.month} D:${birthCalendar.day}, Target M:${targetMonth} D:${targetDay}, Match:${matches}`);
        
        return matches;
      } else if (daysAhead !== null) {
        const thisYearBirthday = new Date(todayYear, birthCalendar.month, birthCalendar.day);
        thisYearBirthday.setHours(0, 0, 0, 0);
        
        const nextYearBirthday = new Date(todayYear + 1, birthCalendar.month, birthCalendar.day);
        nextYearBirthday.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysAhead);
        targetDate.setHours(23, 59, 59, 999);
        
        const isTodayOrFuture = thisYearBirthday >= today && thisYearBirthday <= targetDate;
        const isNextYear = thisYearBirthday < today && nextYearBirthday <= targetDate;
        
        const shouldInclude = isTodayOrFuture || isNextYear;
        
        //console.log(`${r.name}: Birth M:${birthCalendar.month} D:${birthCalendar.day}, ThisYear:${thisYearBirthday.toDateString()}, Include:${shouldInclude}`);
        
        return shouldInclude;
      }
      
      return false;
    });

    //console.log(`Found ${result.length} birthdays matching criteria`);

    // Enrich with calculated data
    const enriched = result.map(record => {
      const birthCalendar = extractCalendarDate(record.dateOfBirth);
      const today = getTodayIST();
      
      let thisYearBirthday = new Date(today.getFullYear(), birthCalendar.month, birthCalendar.day);
      thisYearBirthday.setHours(0, 0, 0, 0);
      
      if (specificDate) {
        const targetDate = new Date(specificDate);
        thisYearBirthday = new Date(targetDate.getFullYear(), birthCalendar.month, birthCalendar.day);
        thisYearBirthday.setHours(0, 0, 0, 0);
      }
      
      if (thisYearBirthday < today && !specificDate) {
        thisYearBirthday = new Date(today.getFullYear() + 1, birthCalendar.month, birthCalendar.day);
        thisYearBirthday.setHours(0, 0, 0, 0);
      }
      
      const timeDiff = thisYearBirthday.getTime() - today.getTime();
      const daysUntil = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      const age = thisYearBirthday.getFullYear() - birthCalendar.year;
      
      //console.log(`  -> ${record.name}: daysUntil=${daysUntil}, birthday=${thisYearBirthday.toDateString()}`);
      
      // ✅ FIXED: Store formatted date string directly to avoid re-parsing issues
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const formattedDate = `${thisYearBirthday.getDate()} ${monthNames[thisYearBirthday.getMonth()]} ${thisYearBirthday.getFullYear()}`;
      
      return {
        ...record,
        daysUntilBirthday: daysUntil,
        upcomingAge: age,
        birthdayDate: formattedDate // Store pre-formatted to avoid timezone issues
      };
    });

    const validEnriched = enriched.filter(b => b.daysUntilBirthday >= 0);
    
    //console.log(`After filtering negatives: ${validEnriched.length} birthdays`);
    //console.log("=== END DEBUG ===\n");
    
    validEnriched.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
    setBirthdays(validEnriched);
    setCurrentPage(1);
  };

  const handleMandalChange = (mandal) => {
    setSelectedMandal(mandal);
    setSelectedVillage('');
    setBirthdays([]);
    
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
    
    if (selectedMandal && village) {
      if (selectedDate) {
        filterBirthdays(allRecords, selectedMandal, village, null, selectedDate);
      } else {
        filterBirthdays(allRecords, selectedMandal, village, 1);
      }
    } else {
      setBirthdays([]);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    
    if (selectedMandal && selectedVillage) {
      if (date) {
        filterBirthdays(allRecords, selectedMandal, selectedVillage, null, date);
      } else {
        filterBirthdays(allRecords, selectedMandal, selectedVillage, 1);
      }
    }
  };

  const resetFilters = () => {
    setSelectedMandal('');
    setSelectedVillage('');
    setSelectedDate('');
    setVillages([]);
    setBirthdays([]);
  };

  // ✅ FIXED: Format date without timezone issues
  const formatDate = (dateString) => {
    // If already formatted (contains spaces), return as-is
    if (dateString.includes(' ')) {
      return dateString;
    }
    
    // Handle ISO date strings (YYYY-MM-DD) without timezone issues
    if (dateString.includes('-') && dateString.length === 10) {
      const [year, month, day] = dateString.split('-');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
    }
    
    // Fallback
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getDaysText = (days) => {
    if (days === 0) return 'Today! 🎉';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Past';
    return `In ${days} days`;
  };

  const getBadgeColor = (days) => {
    if (days === 0) return 'bg-success';
    if (days === 1) return 'bg-warning';
    if (days < 0) return 'bg-secondary';
    if (days <= 7) return 'bg-info';
    return 'bg-primary';
  };

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentBirthdays = birthdays.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(birthdays.length / recordsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
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

  return (
    <div className="container-fluid">
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">🎂 Birthday Filters</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-bold">Select Mandal</label>
              <select
                className="form-select"
                value={selectedMandal}
                onChange={(e) => handleMandalChange(e.target.value)}
              >
                <option value="">-- Choose Mandal --</option>
                {mandals.map(mandal => (
                  <option key={mandal} value={mandal}>{mandal}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Select Village</label>
              <select
                className="form-select"
                value={selectedVillage}
                onChange={(e) => handleVillageChange(e.target.value)}
                disabled={!selectedMandal}
              >
                <option value="">-- Choose Village --</option>
                {villages.map(village => (
                  <option key={village} value={village}>{village}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold">Select Date (Optional)</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={!selectedMandal || !selectedVillage}
              />
            </div>

            <div className="col-md-1 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={resetFilters}>
                🔄
              </button>
            </div>
          </div>
          
          {(selectedMandal || selectedVillage || selectedDate) && (
            <div className="alert alert-info mt-3 mb-0">
              <strong>Filters:</strong>
              {selectedMandal && ` Mandal: ${selectedMandal}`}
              {selectedVillage && ` → Village: ${selectedVillage}`}
              {selectedDate && ` → Date: ${formatDate(selectedDate)}`}
              {!selectedDate && selectedVillage && ` → Next 1 day`}
            </div>
          )}
        </div>
      </div>

      {!selectedMandal && !selectedVillage && (
        <div className="alert alert-info">
          <h5 className="alert-heading">🎂 How to View Birthdays</h5>
          <ol className="mb-0">
            <li>Select a <strong>Mandal</strong> from the filter above</li>
            <li>Then select a <strong>Village</strong></li>
            <li>Birthday records will appear with pagination</li>
            <li>Optionally, select a specific date to view birthdays on that day</li>
          </ol>
        </div>
      )}

      {selectedMandal && !selectedVillage && (
        <div className="alert alert-warning">
          <strong>⚠️ Please select a Village</strong> to view birthday records from {selectedMandal}
        </div>
      )}

      {selectedMandal && selectedVillage && (
        <>
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-1">🎂 Birthday Records</h3>
                      <p className="mb-0 opacity-75">
                        {selectedDate ? `On ${formatDate(selectedDate)}` : 'Next 1 Day'} - {selectedVillage}, {selectedMandal}
                      </p>
                    </div>
                    <div className="text-end">
                      <h2 className="mb-0">{birthdays.length}</h2>
                      <small>Birthday{birthdays.length !== 1 ? 's' : ''}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {birthdays.length === 0 ? (
            <div className="alert alert-info">
              <strong>ℹ️ No birthdays found</strong><br />
              {selectedDate 
                ? `There are no birthdays on ${formatDate(selectedDate)} in ${selectedVillage}, ${selectedMandal}.`
                : `There are no birthdays in the next 1 day in ${selectedVillage}, ${selectedMandal}.`}
            </div>
          ) : (
            <>
              <div className="row">
                {currentBirthdays.map((person) => (
                  <div key={person.id} className="col-md-6 col-lg-4 col-xl-3 mb-4">
                    <div className="card h-100 shadow-sm border-0 hover-card" style={{ transition: 'transform 0.2s' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <h6 className="card-title mb-1 text-primary">{person.name}</h6>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                              {person.villageName}
                            </p>
                          </div>
                          <span className={`badge ${getBadgeColor(person.daysUntilBirthday)} ms-2`} style={{ fontSize: '0.7rem' }}>
                            {getDaysText(person.daysUntilBirthday)}
                          </span>
                        </div>

                        <div className="mb-2" style={{ fontSize: '0.85rem' }}>
                          <div className="d-flex align-items-center mb-1">
                            <span className="me-2">🎂</span>
                            <strong>Birthday:</strong>
                            <span className="ms-2">{person.birthdayDate}</span>
                          </div>
                          <div className="d-flex align-items-center mb-1">
                            <span className="me-2">🎉</span>
                            <strong>Age:</strong>
                            <span className="ms-2">{person.upcomingAge} years</span>
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
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="card shadow-sm mt-4">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted">
                        Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, birthdays.length)} of {birthdays.length} birthdays
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
                </div>
              )}
            </>
          )}
        </>
      )}

      <style>{`
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default UpcomingBirthdays;