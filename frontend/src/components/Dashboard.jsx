import { useState, useEffect } from "react";
import FilterBar from "./FilterBar";
import StatsCard from "./StatsCard";

function Dashboard({ records = [] }) {
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedMandal, setSelectedMandal] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");

  // ✅ Process records when they change
  useEffect(() => {
    setFilteredRecords(records);
    const uniqueMandals = [...new Set(records.map(r => r.mandalName))].filter(Boolean).sort();
    setMandals(uniqueMandals);
  }, [records]);

  // Filter logic
  useEffect(() => {
    let filtered = records;

    if (selectedMandal) {
      filtered = filtered.filter(r => r.mandalName === selectedMandal);
      const uniqueVillages = [...new Set(filtered.map(r => r.villageName))].filter(Boolean).sort();
      setVillages(uniqueVillages);
    } else {
      setVillages([]);
      setSelectedVillage("");
    }

    if (selectedVillage) {
      filtered = filtered.filter(r => r.villageName === selectedVillage);
    }

    setFilteredRecords(filtered);
  }, [selectedMandal, selectedVillage, records]);

  // Calculate statistics
  const male = filteredRecords.filter(r => r.gender && r.gender.toUpperCase() === "MALE").length;
  const female = filteredRecords.filter(r => r.gender && r.gender.toUpperCase() === "FEMALE").length;
  
  const stats = {
    totalFamilies: filteredRecords.length,
    totalPersons: male + female,
    male: male,
    female: female,
    uniqueRationCards: new Set(
      filteredRecords
        .map(r => r.rationCard)
        .filter(card => {
          if (!card || card === '' || card === 'null') return false;
          const cardStr = String(card).trim().toUpperCase();
          if (cardStr === 'NO' || 
              cardStr === 'NOT FOUND' || 
              cardStr === 'NA' || 
              cardStr === 'N/A' ||
              cardStr === 'NULL' ||
              cardStr === 'NONE') {
            return false;
          }
          return true;
        })
        .map(card => String(card).trim().toUpperCase())
    ).size,
    uniqueVoterCards: new Set(
      filteredRecords
        .map(r => r.voterCard)
        .filter(card => {
          if (!card || card.toString().trim() === '') return false;
          const cardStr = String(card).trim().toUpperCase();
          if (cardStr === 'BELOW 18 YEARS' || 
              cardStr === 'NOT FOUND' || 
              cardStr === 'NA' || 
              cardStr === 'N/A' ||
              cardStr === 'NULL') {
            return false;
          }
          return true;
        })
        .map(card => String(card).trim().toUpperCase())
    ).size,
  };

  // Calculate age groups
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    return today.getFullYear() - birth.getFullYear();
  };

  const ageGroups = {
    "0-5": 0,
    "6-10": 0,
    "11-20": 0,
    "21-30": 0,
    "31-40": 0,
    "41-50": 0,
    "51-60": 0,
    "61+": 0,
  };

  filteredRecords.forEach(r => {
    const age = calculateAge(r.dateOfBirth);
    if (age !== null) {
      if (age <= 5) ageGroups["0-5"]++;
      else if (age <= 10) ageGroups["6-10"]++;
      else if (age <= 20) ageGroups["11-20"]++;
      else if (age <= 30) ageGroups["21-30"]++;
      else if (age <= 40) ageGroups["31-40"]++;
      else if (age <= 50) ageGroups["41-50"]++;
      else if (age <= 60) ageGroups["51-60"]++;
      else ageGroups["61+"]++;
    }
  });

  // Top 10 summaries
  const getTop10 = (field) => {
    const counts = {};
    filteredRecords.forEach(r => {
      const value = r[field];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  const topCastes = getTop10("caste");
  const topOccupations = getTop10("occupation");
  const topQualifications = getTop10("qualification");
  const topSchemes = getTop10("schemesEligible");

  const resetFilters = () => {
    setSelectedMandal("");
    setSelectedVillage("");
  };

  return (
    <div>
      <FilterBar
        mandals={mandals}
        villages={villages}
        selectedMandal={selectedMandal}
        selectedVillage={selectedVillage}
        onMandalChange={setSelectedMandal}
        onVillageChange={setSelectedVillage}
        onReset={resetFilters}
      />

      {/* Statistics Cards */}
      <div className="row">
        <StatsCard icon="👨‍👩‍👧‍👦" title="Total Families" value={stats.totalFamilies} bgColor="primary" />
        <StatsCard icon="👥" title="Total Persons" value={stats.totalPersons} bgColor="success" />
        <StatsCard icon="👨" title="Male" value={stats.male} bgColor="info" />
        <StatsCard icon="👩" title="Female" value={stats.female} bgColor="warning" textColor="dark" />
        <StatsCard icon="🎫" title="Ration Cards" value={stats.uniqueRationCards} bgColor="danger" />
        <StatsCard icon="🗳" title="Voter Cards" value={stats.uniqueVoterCards} bgColor="secondary" />
      </div>

      {/* Field Summaries */}
      <div className="row mt-4">
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">📊 Top 10 Castes</h6>
            </div>
            <div className="card-body">
              {topCastes.length > 0 ? (
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table className="table table-sm mb-0">
                    <tbody>
                      {topCastes.map(([caste, count]) => (
                        <tr key={caste}>
                          <td>{caste}</td>
                          <td className="text-end">
                            <span className="badge bg-primary">{count}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0">No data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h6 className="mb-0">💼 Top 10 Occupations</h6>
            </div>
            <div className="card-body">
              {topOccupations.length > 0 ? (
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table className="table table-sm mb-0">
                    <tbody>
                      {topOccupations.map(([occupation, count]) => (
                        <tr key={occupation}>
                          <td>{occupation}</td>
                          <td className="text-end">
                            <span className="badge bg-success">{count}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0">No data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h6 className="mb-0">🎓 Top 10 Qualifications</h6>
            </div>
            <div className="card-body">
              {topQualifications.length > 0 ? (
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table className="table table-sm mb-0">
                    <tbody>
                      {topQualifications.map(([qualification, count]) => (
                        <tr key={qualification}>
                          <td>{qualification}</td>
                          <td className="text-end">
                            <span className="badge bg-info">{count}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0">No data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h6 className="mb-0">🎯 Top 10 Schemes Eligible</h6>
            </div>
            <div className="card-body">
              {topSchemes.length > 0 ? (
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table className="table table-sm mb-0">
                    <tbody>
                      {topSchemes.map(([scheme, count]) => (
                        <tr key={scheme}>
                          <td>{scheme}</td>
                          <td className="text-end">
                            <span className="badge bg-warning text-dark">{count}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Age Summary */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white">
              <h6 className="mb-0">📅 Age Distribution</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                {Object.entries(ageGroups).map(([group, count]) => (
                  <div key={group} className="col-6 col-md-3 col-lg mb-3">
                    <div className="border rounded p-3">
                      <h4 className="text-primary mb-0">{count}</h4>
                      <small className="text-muted">{group} years</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;