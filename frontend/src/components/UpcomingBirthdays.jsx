import { useState, useEffect } from 'react';

const UpcomingBirthdays = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = 'https://smart-village-cn6f.onrender.com';

  useEffect(() => {
    fetchUpcomingBirthdays();
  }, []);

  const fetchUpcomingBirthdays = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/birthdays/upcoming`);
      if (!response.ok) {
        throw new Error('Failed to fetch birthdays');
      }
      const data = await response.json();
      setBirthdays(data);
    } catch (err) {
      setError('Failed to load upcoming birthdays');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day}, ${month} ${year}`;
  };

  const getDaysText = (days) => {
    if (days === 0) return 'Today! 🎉';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const getBadgeColor = (days) => {
    if (days === 0) return 'bg-danger';
    if (days <= 3) return 'bg-warning';
    if (days <= 7) return 'bg-info';
    return 'bg-secondary';
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading upcoming birthdays...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          ❌ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-1">🎂 Upcoming Birthdays</h3>
                  <p className="mb-0 opacity-75">Next 30 Days</p>
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

      {/* Birthdays List */}
      {birthdays.length === 0 ? (
        <div className="alert alert-info">
          <strong>ℹ️ No upcoming birthdays</strong><br />
          There are no birthdays in the next 30 days.
        </div>
      ) : (
        <div className="row">
          {birthdays.map((person, index) => (
            <div key={person.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm border-0 hover-card" style={{ transition: 'transform 0.2s' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-1 text-primary">
                        {person.name}
                      </h5>
                      <p className="text-muted small mb-0">
                        {person.villageName}, {person.mandalName}
                      </p>
                    </div>
                    <span className={`badge ${getBadgeColor(person.daysUntilBirthday)} ms-2`}>
                      {getDaysText(person.daysUntilBirthday)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <span className="me-2">🎂</span>
                      <strong>Birthday:</strong>
                      <span className="ms-2">{formatDate(person.birthdayDate)}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <span className="me-2">🎉</span>
                      <strong>Turning:</strong>
                      <span className="ms-2">{person.upcomingAge} years old</span>
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
                    <div className="alert alert-success mb-0 py-2 px-3">
                      <strong>🎊 It's their birthday today!</strong>
                    </div>
                  )}

                  {person.daysUntilBirthday === 1 && (
                    <div className="alert alert-warning mb-0 py-2 px-3">
                      <strong>⏰ Birthday tomorrow!</strong>
                    </div>
                  )}
                </div>

                <div className="card-footer bg-light border-0">
                  <small className="text-muted">
                    {person.gender && `${person.gender} • `}
                    {person.address || 'No address provided'}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="row mt-4">
        <div className="col-md-3 mb-3">
          <div className="card text-center shadow-sm border-0 bg-danger text-white">
            <div className="card-body">
              <h3 className="mb-0">{birthdays.filter(b => b.daysUntilBirthday === 0).length}</h3>
              <small>Today</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center shadow-sm border-0 bg-warning text-dark">
            <div className="card-body">
              <h3 className="mb-0">{birthdays.filter(b => b.daysUntilBirthday >= 1 && b.daysUntilBirthday <= 3).length}</h3>
              <small>Next 3 Days</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center shadow-sm border-0 bg-info text-white">
            <div className="card-body">
              <h3 className="mb-0">{birthdays.filter(b => b.daysUntilBirthday >= 4 && b.daysUntilBirthday <= 7).length}</h3>
              <small>This Week</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center shadow-sm border-0 bg-secondary text-white">
            <div className="card-body">
              <h3 className="mb-0">{birthdays.filter(b => b.daysUntilBirthday > 7).length}</h3>
              <small>Beyond Week</small>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default UpcomingBirthdays;