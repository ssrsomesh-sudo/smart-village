import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config/api';

const SMSCenter = ({ records: allRecordsFromProps = [] }) => {
  const [activeTab, setActiveTab] = useState('send');
  
  // Data
  const [allRecords, setAllRecords] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  
  // Filters
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [gender, setGender] = useState('');
  
  // Recipients
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // ✅ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  
  // ✅ Birthday pagination
  const [birthdayCurrentPage, setBirthdayCurrentPage] = useState(1);
  const [birthdayRecordsPerPage, setBirthdayRecordsPerPage] = useState(25);
  
  // Message
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Birthday specific
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [selectedBirthdayRecipients, setSelectedBirthdayRecipients] = useState([]);
  
  // ✅ Birthday filters
  const [birthdayMandal, setBirthdayMandal] = useState('');
  const [birthdayVillage, setBirthdayVillage] = useState('');
  const [birthdayVillages, setBirthdayVillages] = useState([]);
  const [filteredBirthdays, setFilteredBirthdays] = useState([]);
  
  // Loading states
  const [sending, setSending] = useState(false);
  
  // History & Stats
  const [smsHistory, setSmsHistory] = useState([]);
  const [smsStats, setSmsStats] = useState(null);
// ============================================
// ADD THESE TO YOUR SMSCenter.jsx COMPONENT
// ============================================

// 1. ADD THESE STATE VARIABLES (after your other useState declarations around line 50):

const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
const [historyRecordsPerPage, setHistoryRecordsPerPage] = useState(25);

// 2. ADD THESE PAGINATION CALCULATIONS (after your state declarations, before the functions):

// Pagination for SMS History
const historyIndexOfLastRecord = historyCurrentPage * historyRecordsPerPage;
const historyIndexOfFirstRecord = historyIndexOfLastRecord - historyRecordsPerPage;
const currentHistoryRecords = smsHistory.slice(historyIndexOfFirstRecord, historyIndexOfLastRecord);
const totalHistoryPages = Math.ceil(smsHistory.length / historyRecordsPerPage);

// 3. ADD THIS HELPER FUNCTION (after your other helper functions):

const getHistoryPageNumbers = () => {
  const pages = [];
  const maxVisible = 5;

  if (totalHistoryPages <= maxVisible) {
    for (let i = 1; i <= totalHistoryPages; i++) {
      pages.push(i);
    }
  } else {
    if (historyCurrentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalHistoryPages);
    } else if (historyCurrentPage >= totalHistoryPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalHistoryPages - 3; i <= totalHistoryPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(historyCurrentPage - 1);
      pages.push(historyCurrentPage);
      pages.push(historyCurrentPage + 1);
      pages.push('...');
      pages.push(totalHistoryPages);
    }
  }

  return pages;
};

  // SMS Templates
  const templates = [
    {
      id: 'custom',
      name: '✍️ Write Your Own',
      text: ''
    },
    {
      id: 'birthday',
      name: '🎂 Birthday Wishes',
      text: 'Happy Birthday! 🎂 Wishing you a wonderful year ahead filled with joy and success. - Smart Village Team'
    },
    {
      id: 'meeting',
      name: '📅 Meeting Notification',
      text: 'Village meeting on [DATE] at [TIME] at [LOCATION]. Your presence is important. Contact: [PHONE]'
    },
    {
      id: 'announcement',
      name: '📢 General Announcement',
      text: 'Important announcement: [YOUR MESSAGE]. For details, contact village office.'
    },
    {
      id: 'scheme',
      name: '🏛️ Government Scheme',
      text: 'New scheme: [SCHEME NAME]. Eligibility: [CRITERIA]. Visit office with documents. Deadline: [DATE]'
    },
    {
      id: 'emergency',
      name: '⚠️ Emergency Alert',
      text: '⚠️ URGENT: [EMERGENCY DETAILS]. Take necessary precautions. Emergency: 108. Office: [PHONE]'
    },
    {
      id: 'festival',
      name: '🎊 Festival Greetings',
      text: 'Wishing you and your family a joyous [FESTIVAL NAME]! May this bring happiness and prosperity.'
    }
  ];

  // ✅ Define functions BEFORE useEffect that uses them
 const loadSMSHistory = async () => {
  try {
    const res = await fetch(`${API_URL}/sms-history`);
    const data = await res.json();
    
    // ✅ Validate that data is an array
    if (Array.isArray(data)) {
      setSmsHistory(data);
    } else {
      console.error('SMS history response is not an array:', data);
      setSmsHistory([]);
    }
  } catch (error) {
    console.error('Error loading SMS history:', error);
    setSmsHistory([]);  // ✅ Set empty array on error
  }
};

const loadSMSStats = async () => {
  try {
    const res = await fetch(`${API_URL}/sms-stats`);
    const data = await res.json();
    
    // ✅ Validate response structure
    if (data && typeof data === 'object' && !data.error) {
      setSmsStats(data);
    } else {
      console.error('Invalid SMS stats response:', data);
      setSmsStats({
        totalMessagesSent: 0,
        totalRecipients: 0,
        sentToday: 0
      });
    }
  } catch (error) {
    console.error('Error loading SMS stats:', error);
    setSmsStats({
      totalMessagesSent: 0,
      totalRecipients: 0,
      sentToday: 0
    });  // ✅ Set default values on error
  }
};

  const loadTodayBirthdays = useCallback(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    const birthdays = allRecords.filter(r => {
      if (!r.dateOfBirth || !r.phoneNumber) return false;
      const birth = new Date(r.dateOfBirth);
      return birth.getMonth() === todayMonth && birth.getDate() === todayDay;
    });

    setTodayBirthdays(birthdays);
    setFilteredBirthdays(birthdays); // Initially show all
    setSelectedBirthdayRecipients(birthdays.map(b => b.id));
  }, [allRecords]);

  // ✅ Filter birthdays by mandal/village - require BOTH
  useEffect(() => {
    // Reset if no mandal selected
    if (!birthdayMandal) {
      setBirthdayVillages([]);
      setBirthdayVillage('');
      setFilteredBirthdays([]);
      setSelectedBirthdayRecipients([]);
      return;
    }

    // Get villages for selected mandal
    const mandalFiltered = todayBirthdays.filter(r => r.mandalName === birthdayMandal);
    const uniqueVillages = [...new Set(mandalFiltered.map(r => r.villageName))].filter(Boolean).sort();
    setBirthdayVillages(uniqueVillages);

    // Only show birthdays if BOTH mandal AND village are selected
    if (birthdayVillage) {
      const filtered = mandalFiltered.filter(r => r.villageName === birthdayVillage);
      setFilteredBirthdays(filtered);
      setSelectedBirthdayRecipients(filtered.map(b => b.id));
    } else {
      setFilteredBirthdays([]);
      setSelectedBirthdayRecipients([]);
    }

    setBirthdayCurrentPage(1); // Reset to page 1
  }, [birthdayMandal, birthdayVillage, todayBirthdays]);

  const handleBirthdayReset = () => {
    setBirthdayMandal('');
    setBirthdayVillage('');
    setBirthdayVillages([]);
    setFilteredBirthdays([]);
    setSelectedBirthdayRecipients([]);
    setBirthdayCurrentPage(1);
  };

  // ✅ Reset function for Send SMS tab
  const handleSendSMSReset = () => {
    setSelectedMandal('');
    setSelectedVillage('');
    setVillages([]);
    setAgeMin('');
    setAgeMax('');
    setGender('');
    setFilteredRecords([]);
    setSelectedRecipients([]);
    setShowPreview(false);
    setMessage('');
    setSelectedTemplate('');
    setCurrentPage(1);
  };

  // ✅ Now useEffect can use the functions defined above
  useEffect(() => {
    if (allRecordsFromProps.length > 0) {
      setAllRecords(allRecordsFromProps);
      const uniqueMandals = [...new Set(allRecordsFromProps.map(r => r.mandalName))].filter(Boolean).sort();
      setMandals(uniqueMandals);
    }
  }, [allRecordsFromProps]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadSMSHistory();
    }
    if (activeTab === 'stats') {
      loadSMSStats();
    }
    if (activeTab === 'birthday') {
      loadTodayBirthdays();
      setBirthdayCurrentPage(1); // Reset to first page
    }
  }, [activeTab, loadTodayBirthdays]);

  // ✅ Reset to page 1 when records per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [recordsPerPage]);

  const handleMandalChange = (mandal) => {
    setSelectedMandal(mandal);
    setSelectedVillage('');
    setFilteredRecords([]);
    setSelectedRecipients([]);
    setShowPreview(false);
    setCurrentPage(1);
    
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
    setFilteredRecords([]);
    setSelectedRecipients([]);
    setShowPreview(false);
    setCurrentPage(1);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // ✅ Fixed filter logic
  const applyFilters = () => {
    let filtered = allRecords;

    // Must have phone number
    filtered = filtered.filter(r => r.phoneNumber);

    // Apply mandal filter
    if (selectedMandal) {
      filtered = filtered.filter(r => r.mandalName === selectedMandal);
    }

    // Apply village filter
    if (selectedVillage) {
      filtered = filtered.filter(r => r.villageName === selectedVillage);
    }

    // Apply gender filter - ✅ FIXED
    if (gender) {
      filtered = filtered.filter(r => {
        // Handle case-insensitive comparison and null/undefined values
        if (!r.gender) return false;
        return r.gender.toLowerCase() === gender.toLowerCase();
      });
    }

    // Apply age filters
    if (ageMin || ageMax) {
      filtered = filtered.filter(r => {
        const age = calculateAge(r.dateOfBirth);
        if (age === null) return false;
        if (ageMin && age < parseInt(ageMin)) return false;
        if (ageMax && age > parseInt(ageMax)) return false;
        return true;
      });
    }

    setFilteredRecords(filtered);
    setSelectedRecipients(filtered.map(r => r.id));
    setShowPreview(true);
    setCurrentPage(1);

    if (filtered.length === 0) {
      alert('⚠️ No residents found matching your filters.');
    } else {
      alert(`✅ Found ${filtered.length} recipients matching your filters`);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.text);
      setSelectedTemplate(templateId);
    }
  };

  const toggleRecipient = (recordId) => {
    setSelectedRecipients(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  // ✅ Select All with warning
  const toggleAllRecipients = () => {
    if (selectedRecipients.length === filteredRecords.length) {
      // Deselect all - no warning needed
      setSelectedRecipients([]);
    } else {
      // Select all - show warning
      const confirm = window.confirm(
        `⚠️ SELECT ALL WARNING\n\n` +
        `You are about to select ALL ${filteredRecords.length} recipients.\n\n` +
        `This means ALL these people will receive your SMS message.\n\n` +
        `Are you sure you want to select everyone?`
      );
      
      if (confirm) {
        setSelectedRecipients(filteredRecords.map(r => r.id));
      }
    }
  };

  const toggleBirthdayRecipient = (recordId) => {
    setSelectedBirthdayRecipients(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  const toggleAllBirthdayRecipients = () => {
    if (selectedBirthdayRecipients.length === filteredBirthdays.length) {
      setSelectedBirthdayRecipients([]);
    } else {
      const confirm = window.confirm(
        `⚠️ SELECT ALL WARNING\n\n` +
        `You are about to select ALL ${filteredBirthdays.length} birthday recipients.\n\n` +
        `Continue?`
      );
      
      if (confirm) {
        setSelectedBirthdayRecipients(filteredBirthdays.map(b => b.id));
      }
    }
  };

const handleSendBirthdaySMS = async () => {
  if (selectedBirthdayRecipients.length === 0) {
    alert('⚠️ Please select at least one recipient');
    return;
  }

  // ✅ Get the birthday message from template or use visible preview message
  let messageToSend = message.trim();
  
  if (!messageToSend) {
    // Use the default birthday template that's shown in preview
    const birthdayTemplate = templates.find(t => t.id === 'birthday');
    messageToSend = birthdayTemplate ? birthdayTemplate.text : 
      'Happy Birthday! 🎂 Wishing you a wonderful year ahead filled with joy and success. - Smart Village Team';
  }

  const confirmation = window.confirm(
    `📤 Send birthday SMS to ${selectedBirthdayRecipients.length} recipients?\n\n` +
    `Message: ${messageToSend.substring(0, 100)}${messageToSend.length > 100 ? '...' : ''}\n\n` +
    `Note: [NAME] will be replaced with each person's name.\n\n` +
    `Type "CONFIRM" to proceed.`
  );

  if (!confirmation) return;

  // ✅ Ask for verification code
  const verificationCode = window.prompt('Please type "CONFIRM" to proceed:');
  
  if (verificationCode !== 'CONFIRM') {
    alert('❌ Verification failed. SMS not sent.');
    return;
  }

  setSending(true);

  try {
    const recipients = filteredBirthdays
      .filter(r => selectedBirthdayRecipients.includes(r.id))
      .map(r => r.phoneNumber)
      .filter(num => num);

    if (recipients.length === 0) {
      alert('⚠️ No valid phone numbers found');
      setSending(false);
      return;
    }

    // ✅ Send personalized messages
    let successCount = 0;
    let failedCount = 0;

    for (const recipient of filteredBirthdays.filter(r => selectedBirthdayRecipients.includes(r.id))) {
      const personalizedMessage = messageToSend.replace('[NAME]', recipient.name);
      
      try {
        const response = await fetch(`${API_URL}/send-sms-bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numbers: [recipient.phoneNumber],
            message: personalizedMessage
          })
        });

        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Failed to send to ${recipient.name}:`, error);
        failedCount++;
      }
    }

    if (successCount > 0) {
      alert(
        `✅ Birthday SMS sent!\n\n` +
        `Successful: ${successCount}\n` +
        `Failed: ${failedCount}`
      );
      
      // ✅ RESET ALL FILTERS AND SELECTIONS
      setBirthdayMandal('');
      setBirthdayVillage('');
      setBirthdayVillages([]);
      setFilteredBirthdays([]);
      setSelectedBirthdayRecipients([]);
      setMessage('');
      setSelectedTemplate('');
      setBirthdayCurrentPage(1);
      
      // Switch to history tab
      setActiveTab('history');
      
      // Reload SMS history
      await loadSMSHistory();
    } else {
      alert(`❌ All messages failed to send. Please check your connection.`);
    }
  } catch (error) {
    console.error('Error sending birthday SMS:', error);
    alert('⚠️ Error sending SMS. Please check your connection and try again.');
  } finally {
    setSending(false);
  }
};

const handleSendSMS = async () => {
  if (selectedRecipients.length === 0) {
    alert('⚠️ Please select at least one recipient');
    return;
  }

  if (!message || message.trim() === '') {
    alert('⚠️ Please enter a message');
    return;
  }

  const confirmation = window.confirm(
    `📤 Send SMS to ${selectedRecipients.length} recipients?\n\n` +
    `Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}\n\n` +
    `Click OK to proceed.`
  );

  if (!confirmation) return;

  setSending(true);

  try {
    const recipients = filteredRecords
      .filter(r => selectedRecipients.includes(r.id))
      .map(r => r.phoneNumber)
      .filter(num => num);

    if (recipients.length === 0) {
      alert('⚠️ No valid phone numbers found');
      setSending(false);
      return;
    }

    const response = await fetch(`${API_URL}/send-sms-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numbers: recipients,
        message: message
      })
    });

    const result = await response.json();

    if (result.success) {
      alert(
        `✅ SMS sent successfully!\n\n` +
        `Recipients: ${result.totalNumbers}\n` +
        `${result.testMode ? '(Test Mode - No actual SMS sent)' : ''}`
      );
      
      // ✅ RESET FILTERS (optional for Send SMS tab)
      setSelectedMandal('');
      setSelectedVillage('');
      setVillages([]);
      setFilteredRecords([]);
      setSelectedRecipients([]);
      setMessage('');
      setSelectedTemplate('');
      setAgeMin('');
      setAgeMax('');
      setGender('');
      setCurrentPage(1);
      
      // Switch to history tab
      setActiveTab('history');
      
      // Reload history
      await loadSMSHistory();
      
    } else {
      alert(`❌ Failed to send SMS: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    alert('⚠️ Error sending SMS. Please check your connection and try again.');
  } finally {
    setSending(false);
  }
};

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    return `${day} ${month}`;
  };

  // ✅ Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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

  // ✅ Birthday pagination logic
  const birthdayIndexOfLastRecord = birthdayCurrentPage * birthdayRecordsPerPage;
  const birthdayIndexOfFirstRecord = birthdayIndexOfLastRecord - birthdayRecordsPerPage;
  const currentBirthdayRecords = filteredBirthdays.slice(birthdayIndexOfFirstRecord, birthdayIndexOfLastRecord);
  const birthdayTotalPages = Math.ceil(filteredBirthdays.length / birthdayRecordsPerPage);

  const birthdayPaginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= birthdayTotalPages) {
      setBirthdayCurrentPage(pageNumber);
    }
  };

  const handleBirthdayRecordsPerPageChange = (e) => {
    setBirthdayRecordsPerPage(Number(e.target.value));
    setBirthdayCurrentPage(1);
  };

  const getBirthdayPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (birthdayTotalPages <= maxVisible) {
      for (let i = 1; i <= birthdayTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (birthdayCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(birthdayTotalPages);
      } else if (birthdayCurrentPage >= birthdayTotalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = birthdayTotalPages - 3; i <= birthdayTotalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(birthdayCurrentPage - 1);
        pages.push(birthdayCurrentPage);
        pages.push(birthdayCurrentPage + 1);
        pages.push('...');
        pages.push(birthdayTotalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="container-fluid">
      {/* Tab Navigation */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'send' ? 'active' : ''}`}
                onClick={() => setActiveTab('send')}
              >
                📤 Send SMS
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'birthday' ? 'active' : ''}`}
                onClick={() => setActiveTab('birthday')}
              >
                🎂 Birthday SMS
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                📜 History
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                📊 Statistics
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ===== SEND SMS TAB ===== */}
      {activeTab === 'send' && (
        <>
          {/* Step 1: Select Recipients */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Step 1: Select Recipients 👥</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
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

                <div className="col-md-6">
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

                {/* Advanced Filters */}
                <div className="col-12">
                  <details className="mt-2">
                    <summary className="btn btn-sm btn-outline-secondary">
                      🔍 Advanced Filters (Optional)
                    </summary>
                    <div className="row g-3 mt-2">
                      <div className="col-md-3">
                        <label className="form-label">Min Age</label>
                        <input
                          type="number"
                          className="form-control"
                          value={ageMin}
                          onChange={(e) => setAgeMin(e.target.value)}
                          placeholder="e.g., 18"
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Max Age</label>
                        <input
                          type="number"
                          className="form-control"
                          value={ageMax}
                          onChange={(e) => setAgeMax(e.target.value)}
                          placeholder="e.g., 60"
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Gender</label>
                        <select
                          className="form-select"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <option value="">All</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </details>
                </div>

                <div className="col-12">
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={applyFilters}
                      disabled={!selectedMandal || !selectedVillage}
                    >
                      🔍 Find Recipients
                    </button>
                    <button 
                      className="btn btn-secondary btn-lg"
                      onClick={handleSendSMSReset}
                    >
                      🔄 Reset All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Preview & Select Recipients with Pagination */}
          {showPreview && filteredRecords.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-success text-white d-flex justify-content-between align-items-center flex-wrap">
                <h5 className="mb-0">Step 2: Review & Select Recipients ✓</h5>
                <div className="d-flex gap-2 align-items-center">
                  {/* ✅ Records per page dropdown */}
                  <select 
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value={recordsPerPage}
                    onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                  >
                    <option value={10}>Show 10</option>
                    <option value={25}>Show 25</option>
                    <option value={50}>Show 50</option>
                    <option value={100}>Show 100</option>
                  </select>
                  
                  <button 
                    className="btn btn-sm btn-light"
                    onClick={toggleAllRecipients}
                  >
                    {selectedRecipients.length === filteredRecords.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="badge bg-white text-dark">
                    {selectedRecipients.length} / {filteredRecords.length} selected
                  </span>
                </div>
              </div>
              <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="table table-sm table-hover">
                  <thead className="sticky-top bg-white">
                    <tr>
                      <th width="50">
                        <input
                          type="checkbox"
                          checked={selectedRecipients.length === filteredRecords.length}
                          onChange={toggleAllRecipients}
                        />
                      </th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Village</th>
                      <th>Age</th>
                      <th>Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map(record => (
                      <tr key={record.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRecipients.includes(record.id)}
                            onChange={() => toggleRecipient(record.id)}
                          />
                        </td>
                        <td>{record.name}</td>
                        <td>{record.phoneNumber}</td>
                        <td>{record.villageName}</td>
                        <td>{calculateAge(record.dateOfBirth) || 'N/A'}</td>
                        <td>{record.gender || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ✅ Pagination controls */}
              {totalPages > 1 && (
                <div className="card-footer">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} recipients
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
              )}
            </div>
          )}

          {showPreview && filteredRecords.length === 0 && (
            <div className="alert alert-warning">
              <strong>⚠️ No residents found</strong><br />
              No residents with phone numbers match your filters in this village.
            </div>
          )}

          {/* Step 3: Compose Message */}
          {showPreview && selectedRecipients.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">Step 3: Compose Message ✉️</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Select Template (Optional)</label>
                  <select
                    className="form-select"
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                  >
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Message</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    maxLength="160"
                  ></textarea>
                  <div className="d-flex justify-content-between mt-1">
                    <small className="text-muted">
                      {message.length}/160 characters
                    </small>
                    {message.length > 140 && (
                      <small className="text-warning">⚠️ Message is getting long</small>
                    )}
                  </div>
                </div>

                <div className="alert alert-warning">
                  <strong>⚠️ Review Before Sending:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Recipients: <strong>{selectedRecipients.length} people</strong></li>
                    <li>Village: <strong>{selectedVillage}</strong></li>
                    <li>Mandal: <strong>{selectedMandal}</strong></li>
                    <li>Message length: <strong>{message.length} characters</strong></li>
                  </ul>
                </div>

                <div className="alert alert-info">
                  <strong>🔐 Verification Required:</strong>
                  <p className="mb-0">You will need to type "CONFIRM" before sending to prevent accidental sends.</p>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleSendSMS}
                    disabled={sending || !message.trim() || selectedRecipients.length === 0}
                  >
                    {sending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sending...
                      </>
                    ) : (
                      <>📤 Send SMS to {selectedRecipients.length} Recipients</>
                    )}
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setMessage('');
                      setSelectedTemplate('');
                    }}
                  >
                    Clear Message
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== BIRTHDAY SMS TAB ===== */}
      {activeTab === 'birthday' && (
        <div className="card shadow-sm">
          <div className="card-header bg-warning">
            <h5 className="mb-0">🎂 Today's Birthdays</h5>
          </div>
          <div className="card-body">
            {/* ✅ Filter Controls */}
            <div className="card mb-3 bg-light">
              <div className="card-body">
                <h6 className="card-title">🔍 Filter Birthdays</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Mandal</label>
                    <select
                      className="form-select"
                      value={birthdayMandal}
                      onChange={(e) => {
                        setBirthdayMandal(e.target.value);
                        setBirthdayVillage('');
                      }}
                    >
                      <option value="">-- Choose Mandal --</option>
                      {mandals.map(mandal => (
                        <option key={mandal} value={mandal}>{mandal}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold">Village</label>
                    <select
                      className="form-select"
                      value={birthdayVillage}
                      onChange={(e) => setBirthdayVillage(e.target.value)}
                      disabled={!birthdayMandal}
                    >
                      <option value="">-- Choose Village --</option>
                      {birthdayVillages.map(village => (
                        <option key={village} value={village}>{village}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4 d-flex align-items-end">
                    <button 
                      className="btn btn-secondary w-100"
                      onClick={handleBirthdayReset}
                    >
                      🔄 Reset Filters
                    </button>
                  </div>
                </div>
                
                <div className="alert alert-info mt-3 mb-0">
                  {birthdayMandal && birthdayVillage ? (
                    <>
                      <strong>📊 Birthdays Found:</strong> {filteredBirthdays.length} in {birthdayVillage}, {birthdayMandal}
                    </>
                  ) : (
                    <>
                      <strong>ℹ️ Tip:</strong> Select mandal and village to see today's birthdays
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Instructions when no filters selected */}
            {!birthdayMandal && !birthdayVillage && (
              <div className="alert alert-info">
                <h5 className="alert-heading">📋 How to View Today's Birthdays</h5>
                <ol className="mb-0">
                  <li>Select a <strong>Mandal</strong> from the filter above</li>
                  <li>Then select a <strong>Village</strong></li>
                  <li>Birthday records will appear</li>
                </ol>
              </div>
            )}

            {/* ✅ Message when only mandal selected */}
            {birthdayMandal && !birthdayVillage && (
              <div className="alert alert-warning">
                <strong>⚠️ Please select a Village</strong> to view birthdays from {birthdayMandal}
              </div>
            )}

            {/* ✅ Show birthdays only when BOTH mandal AND village selected */}
            {birthdayMandal && birthdayVillage && filteredBirthdays.length === 0 && (
              <div className="alert alert-warning">
                <h6 className="alert-heading">No birthdays today in this village</h6>
                <p className="mb-0">
                  There are no birthdays today in {birthdayVillage}, {birthdayMandal}.
                  <br/>Try selecting a different village or check back tomorrow!
                </p>
              </div>
            )}

            {/* ✅ Birthday list - Only show when BOTH mandal AND village selected AND has birthdays */}
            {birthdayMandal && birthdayVillage && filteredBirthdays.length > 0 && (
              <>
                <div className="alert alert-success">
                  <strong>🎉 {filteredBirthdays.length} birthday(s) found in {birthdayVillage}!</strong>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Select recipients:</h6>
                  <div className="d-flex gap-2 align-items-center">
                    {/* ✅ Records per page dropdown */}
                    <label className="mb-0">Show:</label>
                    <select 
                      className="form-select form-select-sm" 
                      style={{ width: 'auto' }}
                      value={birthdayRecordsPerPage}
                      onChange={handleBirthdayRecordsPerPageChange}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>per page</span>
                    
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={toggleAllBirthdayRecipients}
                    >
                      {selectedBirthdayRecipients.length === filteredBirthdays.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="badge bg-primary">
                      {selectedBirthdayRecipients.length} / {filteredBirthdays.length} selected
                    </span>
                  </div>
                </div>

                <div className="table-responsive mb-3">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th width="50">
                          <input
                            type="checkbox"
                            checked={selectedBirthdayRecipients.length === filteredBirthdays.length && filteredBirthdays.length > 0}
                            onChange={toggleAllBirthdayRecipients}
                          />
                        </th>
                        <th>Name</th>
                        <th>Birthday</th>
                        <th>Phone</th>
                        <th>Village</th>
                        <th>Age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBirthdayRecords.map(person => (
                        <tr key={person.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedBirthdayRecipients.includes(person.id)}
                              onChange={() => toggleBirthdayRecipient(person.id)}
                            />
                          </td>
                          <td>{person.name}</td>
                          <td>{formatDateOnly(person.dateOfBirth)}</td>
                          <td>{person.phoneNumber}</td>
                          <td>{person.villageName}</td>
                          <td>{calculateAge(person.dateOfBirth)} years</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ✅ Birthday Pagination */}
                {birthdayTotalPages > 1 && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-muted small">
                          Showing {birthdayIndexOfFirstRecord + 1} to {Math.min(birthdayIndexOfLastRecord, filteredBirthdays.length)} of {filteredBirthdays.length} birthdays
                        </div>
                        <nav>
                          <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${birthdayCurrentPage === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => birthdayPaginate(birthdayCurrentPage - 1)}>Previous</button>
                            </li>
                            {getBirthdayPageNumbers().map((page, index) => (
                              page === '...' ? (
                                <li key={`ellipsis-${index}`} className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              ) : (
                                <li key={page} className={`page-item ${birthdayCurrentPage === page ? 'active' : ''}`}>
                                  <button className="page-link" onClick={() => birthdayPaginate(page)}>{page}</button>
                                </li>
                              )
                            ))}
                            <li className={`page-item ${birthdayCurrentPage === birthdayTotalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => birthdayPaginate(birthdayCurrentPage + 1)}>Next</button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}

                <div className="alert alert-info">
                  <strong>📱 Message Preview:</strong>
                  <p className="mb-0 mt-2">
                    "Happy Birthday [NAME]! 🎂 Wishing you a wonderful year ahead filled with joy and success. - Smart Village Team"
                  </p>
                </div>

                <div className="alert alert-info">
                  <strong>🔐 Verification Required:</strong>
                  <p className="mb-0">You will need to type "CONFIRM" before sending.</p>
                </div>

                <button
                  className="btn btn-warning btn-lg"
                  onClick={handleSendBirthdaySMS}
                  disabled={sending || selectedBirthdayRecipients.length === 0}
                >
                  {sending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending...
                    </>
                  ) : (
                    <>🎂 Send Birthday Wishes to {selectedBirthdayRecipients.length} Selected</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== HISTORY TAB ===== */}
{activeTab === 'history' && (
  <div className="card shadow-sm">
    <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
      <h5 className="mb-0">📜 SMS History</h5>
      <button 
        className="btn btn-light btn-sm"
        onClick={loadSMSHistory}
      >
        🔄 Refresh
      </button>
    </div>
    <div className="card-body">
      {smsHistory.length === 0 ? (
        <div className="text-center text-muted py-5">
          <h5>📭 No SMS history yet</h5>
          <p>Messages sent will appear here</p>
        </div>
      ) : (
        <>
          {/* Pagination Controls - Top */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <label className="mb-0">Show:</label>
              <select 
                className="form-select form-select-sm" 
                style={{ width: 'auto' }}
                value={historyRecordsPerPage}
                onChange={(e) => {
                  setHistoryRecordsPerPage(Number(e.target.value));
                  setHistoryCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-muted">per page</span>
            </div>
            <div className="text-muted">
              Showing {historyIndexOfFirstRecord + 1} to {Math.min(historyIndexOfLastRecord, smsHistory.length)} of {smsHistory.length} messages
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="table table-hover table-sm mb-0" style={{ fontSize: '0.9rem' }}>
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ width: '140px' }}>Date & Time</th>
                  <th style={{ minWidth: '300px' }}>Message</th>
                  <th style={{ width: '70px' }} className="text-center">Count</th>
                  <th style={{ width: '150px' }}>Phone Numbers</th>
                </tr>
              </thead>
              <tbody>
                {currentHistoryRecords.map((log, index) => (
                  <tr key={log.id}>
                    <td className="text-muted">{historyIndexOfFirstRecord + index + 1}</td>
                    <td>
                      <small className="text-nowrap">
                        {new Date(log.sentAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </small>
                    </td>
                    <td>
                      <div style={{ 
                        maxHeight: '80px', 
                        overflowY: 'auto',
                        wordBreak: 'break-word'
                      }}>
                        {log.message}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-primary">
                        {log.recipients}
                      </span>
                    </td>
                    <td>
                      {log.numbers ? (
                        <details className="cursor-pointer">
                          <summary 
                            className="text-primary fw-bold" 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            📱 View
                          </summary>
                          <div className="mt-2 p-2 bg-light rounded" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {log.numbers.split(',').map((num, i) => (
                              <span key={i} className="badge bg-secondary me-1 mb-1 font-monospace">
                                {num.trim()}
                              </span>
                            ))}
                          </div>
                        </details>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Bottom */}
          {totalHistoryPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${historyCurrentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setHistoryCurrentPage(historyCurrentPage - 1)}
                      disabled={historyCurrentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  
                  {getHistoryPageNumbers().map((pageNum, index) => (
                    <li 
                      key={index}
                      className={`page-item ${pageNum === historyCurrentPage ? 'active' : ''} ${pageNum === '...' ? 'disabled' : ''}`}
                    >
                      {pageNum === '...' ? (
                        <span className="page-link">...</span>
                      ) : (
                        <button 
                          className="page-link"
                          onClick={() => setHistoryCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      )}
                    </li>
                  ))}
                  
                  <li className={`page-item ${historyCurrentPage === totalHistoryPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setHistoryCurrentPage(historyCurrentPage + 1)}
                      disabled={historyCurrentPage === totalHistoryPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  </div>
)}

      {/* ===== STATISTICS TAB ===== */}
      {activeTab === 'stats' && (
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0 bg-primary text-white">
              <div className="card-body text-center">
                <h3 className="display-4">{smsStats?.totalMessagesSent || 0}</h3>
                <p className="mb-0">Total Messages Sent</p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0 bg-success text-white">
              <div className="card-body text-center">
                <h3 className="display-4">{smsStats?.totalRecipients || 0}</h3>
                <p className="mb-0">Total Recipients Reached</p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0 bg-warning text-white">
              <div className="card-body text-center">
                <h3 className="display-4">{smsStats?.sentToday || 0}</h3>
                <p className="mb-0">Messages Sent Today</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSCenter;