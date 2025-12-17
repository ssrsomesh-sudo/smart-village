// Trigger redeploy to apply Prisma migrations
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const fast2sms = require('fast-two-sms');
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// 🔥 FIXED GLOBAL CORS — works for Cloudflare Pages, Netlify, localhost
const allowedOrigins = [
  "https://smart-village.pages.dev",
  "https://smart-village1.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173"
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);  // mobile apps / curl
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS: Origin not allowed → " + origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));


// ✅ FIXED: Use proper middleware for all OPTIONS requests instead of app.options("*")
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});

// Body parser middleware - IMPORTANT for DELETE requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel or JSON files are allowed!'), false);
    }
  }
});
// -------------------- DATE / TIME HELPERS (IST-safe) --------------------

/**
 * Return today's date at local midnight in IST (no time component)
 */
function todayIST() {
  const now = new Date();
  // Convert to IST string then back to Date — this gives local IST time as Date object
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istString);
  return new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate());
}

/**
 * Strip time component from a Date (set to local midnight in server timezone)
 */
function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Return birthday date in a given year (Date at midnight)
 */
function birthdayThisYear(dob, referenceDate) {
  return new Date(referenceDate.getFullYear(), dob.getMonth(), dob.getDate());
}

/**
 * Days between two dates (both treated at midnight)
 */
function daysBetween(d1, d2) {
  const a = stripTime(d1);
  const b = stripTime(d2);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Normalize a stored dateOfBirth to IST date (midnight) without changing the calendar date
 * - If record.dateOfBirth is a Date string, this returns a Date at IST midnight for that DOB.
 */
function normalizeDateToISTMidnight(dateValue) {
  if (!dateValue) return null;
  const orig = new Date(dateValue);
  // Convert original Date instant to IST local representation
  const istString = orig.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istString);
  // Create a Date at IST midnight (year, month, day)
  return new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate());
}

// -------------------- Excel date parsing --------------------
// Helper function to parse date from Excel format (DD-MM-YYYY)
function parseExcelDate(dateString) {
  if (!dateString) return null;
  try {
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const [day, month, year] = dateString.split('-');
      const date = new Date(`${year}-${month}-${day}`);
      return isNaN(date.getTime()) ? null : date;
    }
    if (dateString instanceof Date) return dateString;
    if (typeof dateString === 'number') {
      const date = new Date((dateString - 25569) * 86400 * 1000);
      return date;
    }
    return null;
  } catch (err) {
    console.warn('Could not parse date', dateString, err);
    return null;
  }
}
 
// Helper function to check if birthday is this week
function isBirthdayThisWeek(dateOfBirth) {
  if (!dateOfBirth) return false;
  
  // Use IST timezone
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  today.setHours(0, 0, 0, 0);
  
  const dob = new Date(dateOfBirth);
  dob.setFullYear(today.getFullYear());
  
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);
  
  return dob >= today && dob <= weekFromNow;
}

// Helper function to check if birthday is this month
function isBirthdayThisMonth(dateOfBirth) {
  if (!dateOfBirth) return false;
  
  // Use IST timezone
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const dob = new Date(dateOfBirth);
  
  return dob.getMonth() === today.getMonth();
}

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Smart Village API is running!' });
});
app.get('/download-template', (req, res) => {
  try {
    console.log('📥 Template download requested');
    
    const templateData = [
      {
        'MANDAL NAME': 'Example Mandal',
        'VILLAGE NAME': 'Example Village',
        'RATION CARD': 'RC123456',
        'VOTER CARD': 'VC123456',
        'NAME': 'John Doe',
        'NUMBER OF FAMILY PERSONS': 4,
        'ADDRESS': '123 Main Street',
        'PHONE NUMBER': '9876543210',
        'AADHAR': '123456789012',
        'GENDER': 'Male',
        'DATE OF BIRTH': '01-01-1980',
        'QUALIFICATION': 'Graduate',
        'Caste': 'OC',
        'Sub Caste': 'Example',
        'OCCUPATION': 'Farmer',
        'NEED ANY EMPLOYEEMENT': 'No',
        'AROGYASRI CARD NUMBER': 'AC123456',
        'SHG MEMBER': 'Yes',
        'SCHEMES ELIGIBLE FOR': 'PM-KISAN',
        'REMARKS': 'Sample remarks'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Family Records');

    const columnWidths = [
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
      { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
      { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 }
    ];
    worksheet['!cols'] = columnWidths;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Smart-Village-Template.xlsx');
    res.setHeader('Content-Length', buffer.length);
    
    console.log('✅ Template sent, size:', buffer.length, 'bytes');
    res.send(buffer);
  } catch (error) {
    console.error('❌ Error generating template:', error);
    res.status(500).json({ 
      error: 'Failed to generate template file',
      details: error.message 
    });
  }
});
// ✅ POST - Upload and process Excel file
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing Excel file...');
    
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    const sampleRow = rawData[0];
    const columnNames = Object.keys(sampleRow);
    console.log('Excel columns found:', columnNames);
    console.log(`Found ${rawData.length} records in Excel file`);

    // Helper function to get value from row with multiple possible column names
    const getColumnValue = (row, possibleNames) => {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return null;
    };

    // Transform data to match Prisma schema
    const transformedData = rawData.map((row) => {
      const dateOfBirth = parseExcelDate(
        getColumnValue(row, ['DATE OF BIRTH', 'Date of Birth', 'DOB', 'dateOfBirth'])
      );
      
      return {
        mandalName: String(getColumnValue(row, ['MANADAL NAME', 'MANDAL NAME', 'Mandal Name', 'mandalName']) || '').trim(),
        villageName: String(getColumnValue(row, ['VILLAGE NAME', 'Village Name', 'villageName']) || '').trim(),
        rationCard: getColumnValue(row, ['RATION CARD', 'Ration Card', 'rationCard']) ? String(getColumnValue(row, ['RATION CARD', 'Ration Card', 'rationCard'])) : null,
        voterCard: getColumnValue(row, ['VOTER CARD', 'Voter Card', 'voterCard']) ? String(getColumnValue(row, ['VOTER CARD', 'Voter Card', 'voterCard'])) : null,
        name: String(getColumnValue(row, ['NAME', 'Name', 'name', 'Member Name', 'MEMBER NAME']) || '').trim(),
        numFamilyPersons: parseInt(getColumnValue(row, ['NUMBER OF FAMILY PERSONS', 'Number of Family Persons', 'numFamilyPersons', 'Family Members'])) || 0,
        address: String(getColumnValue(row, ['ADDRESS', 'Address', 'address']) || '').trim(),
        phoneNumber: String(getColumnValue(row, ['PHONE NUMBER', 'Phone Number', 'phoneNumber', 'Mobile Number', 'MOBILE NUMBER']) || '').trim(),
        aadhar: getColumnValue(row, ['AADHAR', 'Aadhar', 'aadhar', 'Aadhar Number', 'AADHAR NUMBER']) ? String(getColumnValue(row, ['AADHAR', 'Aadhar', 'aadhar', 'Aadhar Number', 'AADHAR NUMBER'])) : null,
        gender: getColumnValue(row, ['GENDER', 'Gender', 'gender']) ? String(getColumnValue(row, ['GENDER', 'Gender', 'gender'])).trim() : null,
        dateOfBirth: dateOfBirth,
        qualification: getColumnValue(row, ['QUALIFICATION', 'Qualification', 'qualification']) ? String(getColumnValue(row, ['QUALIFICATION', 'Qualification', 'qualification'])).trim() : null,
        caste: getColumnValue(row, ['Caste', 'CASTE', 'caste']) ? String(getColumnValue(row, ['Caste', 'CASTE', 'caste'])).trim() : null,
        subCaste: getColumnValue(row, ['Sub Caste', 'SUB CASTE', 'subCaste', 'Sub-Caste']) ? String(getColumnValue(row, ['Sub Caste', 'SUB CASTE', 'subCaste', 'Sub-Caste'])).trim() : null,
        occupation: getColumnValue(row, ['OCCUPATION', 'Occupation', 'occupation']) ? String(getColumnValue(row, ['OCCUPATION', 'Occupation', 'occupation'])).trim() : null,
        needEmployment: getColumnValue(row, ['NEED ANY EMPLOYEEMENT', 'Need Employment', 'needEmployment']) ? String(getColumnValue(row, ['NEED ANY EMPLOYEEMENT', 'Need Employment', 'needEmployment'])).trim() : null,
        arogyasriCardNumber: getColumnValue(row, ['AROGYASRI CARD NUMBER', 'Arogyasri Card Number', 'arogyasriCardNumber']) ? String(getColumnValue(row, ['AROGYASRI CARD NUMBER', 'Arogyasri Card Number', 'arogyasriCardNumber'])).trim() : null,
        shgMember: getColumnValue(row, ['SHG MEMBER', 'SHG Member', 'shgMember']) ? String(getColumnValue(row, ['SHG MEMBER', 'SHG Member', 'shgMember'])).trim() : null,
        schemesEligible: getColumnValue(row, ['SCHEMES ELIGIBLE FOR', 'Schemes Eligible', 'schemesEligible']) ? String(getColumnValue(row, ['SCHEMES ELIGIBLE FOR', 'Schemes Eligible', 'schemesEligible'])).trim() : null,
        remarks: null,
        birthdayThisWeek: dateOfBirth ? isBirthdayThisWeek(dateOfBirth) : false,
        birthdayThisMonth: dateOfBirth ? isBirthdayThisMonth(dateOfBirth) : false,
      };
    });

    // Validate required fields
    const validData = [];
    const invalidData = [];
    
    transformedData.forEach((record, index) => {
      if (!record.mandalName || !record.villageName || !record.name || !record.address || !record.phoneNumber) {
        invalidData.push({
          row: index + 2,
          missing: {
            mandalName: !record.mandalName,
            villageName: !record.villageName,
            name: !record.name,
            address: !record.address,
            phoneNumber: !record.phoneNumber
          }
        });
      } else {
        validData.push(record);
      }
    });

    console.log(`Validated ${validData.length} records out of ${transformedData.length}`);
    
    if (invalidData.length > 0) {
      console.log('Invalid records:', JSON.stringify(invalidData.slice(0, 5)));
    }

    if (validData.length === 0) {
      return res.status(400).json({ 
        error: 'No valid records found in Excel file',
        details: `All ${transformedData.length} records are missing required fields`,
        columnsFound: columnNames,
        sampleInvalidRecord: invalidData[0],
        requiredFields: ['Mandal Name', 'Village Name', 'Name', 'Address', 'Phone Number']
      });
    }

    // Import records with duplicate checking
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const record of validData) {
      try {
        const existing = await prisma.familyRecord.findFirst({
          where: {
            mandalName: record.mandalName,
            villageName: record.villageName,
            name: record.name,
            phoneNumber: record.phoneNumber
          }
        });

        if (existing) {
          duplicateCount++;
          continue;
        }

        await prisma.familyRecord.create({
          data: record
        });
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error importing record:`, error.message);
      }
    }

    res.json({
      message: 'Excel file processed successfully',
      recordsImported: successCount,
      duplicatesSkipped: duplicateCount,
      errors: errorCount,
      totalProcessed: validData.length
    });

  } catch (error) {
    console.error('Error processing Excel file:', error);
    res.status(500).json({ 
      error: 'Failed to process Excel file',
      details: error.message 
    });
  }
});

// ✅ GET - Get family records with filtering and pagination
app.get('/records', async (req, res) => {
  try {
    const { mandalName, villageName, page = 1, limit = 100 } = req.query;
    
    console.log('📊 Filters received:', { mandalName, villageName, page, limit });

    // Build where clause for filtering
    const where = {};
    
    if (mandalName && mandalName !== '' && mandalName !== 'ALL') {
      where.mandalName = mandalName;
    }
    
    if (villageName && villageName !== '' && villageName !== 'ALL') {
      where.villageName = villageName;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count
    const total = await prisma.familyRecord.count({ where });

    // Get filtered records
    const records = await prisma.familyRecord.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take
    });

    console.log(`✅ Returned ${records.length} of ${total} records`);

    res.json({
      records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('❌ ERROR in /records:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET - Get single record by ID
app.get('/records/:id', async (req, res) => {
  try {
    const record = await prisma.familyRecord.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET - Get records by mandal
app.get('/records/mandal/:mandalName', async (req, res) => {
  try {
    const records = await prisma.familyRecord.findMany({
      where: { mandalName: req.params.mandalName },
      orderBy: { villageName: 'asc' }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET - Get records by village
app.get('/records/village/:villageName', async (req, res) => {
  try {
    const records = await prisma.familyRecord.findMany({
      where: { villageName: req.params.villageName }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET - Get birthdays this month
app.get('/birthdays/month', async (req, res) => {
  try {
    const records = await prisma.familyRecord.findMany({
      where: { birthdayThisMonth: true }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET - Get birthdays this week
app.get('/birthdays/week', async (req, res) => {
  try {
    const records = await prisma.familyRecord.findMany({
      where: { birthdayThisWeek: true }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ FIXED: Get upcoming birthdays endpoint
app.get('/birthdays/upcoming', async (req, res) => {
  try {
    const allRecords = await prisma.familyRecord.findMany({
      where: {
        dateOfBirth: { not: null }
      }
    });

    // Use IST timezone for today's date
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const upcomingBirthdays = allRecords.filter(record => {
      if (!record.dateOfBirth) return false;

      const dob = new Date(record.dateOfBirth);
      const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      const nextYearBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());

      // Check if birthday falls within next 30 days (this year or next year)
      const isUpcoming = (thisYearBirthday >= today && thisYearBirthday <= thirtyDaysFromNow) ||
                         (nextYearBirthday >= today && nextYearBirthday <= thirtyDaysFromNow);

      return isUpcoming;
    });

    // Calculate days until birthday and age for each record
    const enrichedBirthdays = upcomingBirthdays.map(record => {
      const dob = new Date(record.dateOfBirth);
      const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      const nextYearBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
      
      const upcomingBirthday = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
      const daysUntil = Math.ceil((upcomingBirthday - today) / (1000 * 60 * 60 * 24));
      
      // Calculate age they'll turn
      let age = today.getFullYear() - dob.getFullYear();
      if (upcomingBirthday.getFullYear() > today.getFullYear()) {
        age++;
      }

      return {
        ...record,
        daysUntilBirthday: daysUntil,
        upcomingAge: age,
        birthdayDate: upcomingBirthday.toISOString().split('T')[0]
      };
    });

    // Sort by days until birthday (closest first)
    enrichedBirthdays.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

    res.json(enrichedBirthdays);
  } catch (error) {
    console.error('Error fetching upcoming birthdays:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST - Create new record
app.post('/records', async (req, res) => {
  try {
    const { mandalName, villageName, name, numFamilyPersons, gender, phoneNumber, address } = req.body;

    if (!mandalName || !villageName || !name || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await prisma.familyRecord.findFirst({
      where: {
        mandalName: mandalName.trim(),
        villageName: villageName.trim(),
        name: name.trim(),
        phoneNumber: phoneNumber.trim()
      },
    });

    if (existing) {
      return res.status(200).json({
        message: '⚠️ Duplicate skipped',
        existingRecordId: existing.id
      });
    }

    const record = await prisma.familyRecord.create({
      data: {
        mandalName,
        villageName,
        name,
        numFamilyPersons: parseInt(numFamilyPersons) || 0,
        gender: gender || null,
        phoneNumber,
        address: address || null,
      }
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT - Update existing record
app.put('/records/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { mandalName, villageName, name, numFamilyPersons, gender, phoneNumber, address } = req.body;

    const existingRecord = await prisma.familyRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const updatedRecord = await prisma.familyRecord.update({
      where: { id },
      data: {
        mandalName,
        villageName,
        name,
        numFamilyPersons: parseInt(numFamilyPersons) || 0,
        gender: gender || null,
        phoneNumber,
        address: address || null,
      }
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE - Delete record
app.delete('/records/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    console.log(`DELETE request received for record ID: ${id}`);

    const existingRecord = await prisma.familyRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      console.log(`Record ${id} not found`);
      return res.status(404).json({ error: 'Record not found' });
    }

    await prisma.familyRecord.delete({
      where: { id }
    });

    console.log(`Record ${id} deleted successfully`);
    res.json({ message: 'Record deleted successfully', id });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET - Advanced search with multiple criteria
app.get('/search', async (req, res) => {
  try {
    const {
      name,
      mandalName,
      villageName,
      phoneNumber,
      gender,
      minAge,
      maxAge,
      qualification,
      occupation,
      caste
    } = req.query;

    console.log('Search params:', req.query);

    const where = {};

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    if (mandalName) {
      where.mandalName = mandalName;
    }
    if (villageName) {
      where.villageName = villageName;
    }
    if (phoneNumber) {
      where.phoneNumber = { contains: phoneNumber };
    }
    if (gender) {
      where.gender = gender;
    }
    if (qualification) {
      where.qualification = { contains: qualification, mode: 'insensitive' };
    }
    if (occupation) {
      where.occupation = { contains: occupation, mode: 'insensitive' };
    }
    if (caste) {
      where.caste = { contains: caste, mode: 'insensitive' };
    }

    console.log('Where clause:', JSON.stringify(where, null, 2));

    let records = await prisma.familyRecord.findMany({
      where,
      orderBy: { id: 'desc' }
    });

    console.log(`Found ${records.length} records before age filter`);

    if (minAge || maxAge) {
      records = records.filter(record => {
        if (!record.dateOfBirth) return false;
        
        const today = new Date();
        const birthDate = new Date(record.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (minAge && age < parseInt(minAge)) return false;
        if (maxAge && age > parseInt(maxAge)) return false;
        return true;
      });
    }

    console.log(`Returning ${records.length} records after age filter`);
    res.json(records);
  } catch (error) {
    console.error('Error searching records:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET - Export all data as backup (JSON format)
app.get('/backup/export', async (req, res) => {
  try {
    const records = await prisma.familyRecord.findMany({
      orderBy: { id: 'asc' }
    });

    const backup = {
      exportDate: new Date().toISOString(),
      totalRecords: records.length,
      data: records
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=smart-village-backup-${Date.now()}.json`);
    res.json(backup);
  } catch (error) {
    console.error('Error exporting backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST - Restore data from backup
app.post('/backup/restore', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file uploaded' });
    }

    const backupData = JSON.parse(req.file.buffer.toString('utf8'));

    if (!backupData.data || !Array.isArray(backupData.data)) {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }

    console.log(`Restoring ${backupData.data.length} records from backup...`);

    let restoredCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const record of backupData.data) {
      try {
        const { id, ...recordData } = record;

        const existing = await prisma.familyRecord.findFirst({
          where: {
            mandalName: recordData.mandalName,
            villageName: recordData.villageName,
            name: recordData.name,
            phoneNumber: recordData.phoneNumber
          }
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        if (recordData.dateOfBirth) {
          recordData.dateOfBirth = new Date(recordData.dateOfBirth);
        }

        await prisma.familyRecord.create({
          data: recordData
        });
        restoredCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error restoring record:`, error.message);
      }
    }

    res.json({
      message: 'Backup restored successfully',
      restoredRecords: restoredCount,
      skippedDuplicates: skippedCount,
      errors: errorCount,
      totalInBackup: backupData.data.length
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ 
      error: 'Failed to restore backup',
      details: error.message 
    });
  }
});

// ✅ DELETE - Clear all data (use with caution!)
app.delete('/backup/clear-all', async (req, res) => {
  try {
    const { confirmToken } = req.body;

    if (confirmToken !== 'DELETE_ALL_DATA') {
      return res.status(400).json({ 
        error: 'Invalid confirmation token',
        message: 'Send {"confirmToken": "DELETE_ALL_DATA"} to confirm deletion'
      });
    }

    const result = await prisma.familyRecord.deleteMany({});
    
    res.json({ 
      message: 'All records deleted successfully',
      deletedCount: result.count 
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE - Delete all records from a specific village
app.delete('/delete-village/:villageName', async (req, res) => {
  try {
    const villageName = decodeURIComponent(req.params.villageName);

    console.log(`DELETE request for village: ${villageName}`);

    // Count records first
    const count = await prisma.familyRecord.count({
      where: { villageName: villageName }
    });

    if (count === 0) {
      return res.status(404).json({ 
        error: 'No records found for this village',
        villageName: villageName 
      });
    }

    // Delete all records from this village
    const result = await prisma.familyRecord.deleteMany({
      where: { villageName: villageName }
    });

    console.log(`Deleted ${result.count} records from ${villageName}`);
    
    res.json({ 
      message: `Successfully deleted all records from ${villageName}`,
      villageName: villageName,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting village records:', error);
    res.status(500).json({ error: error.message });
  }
});
// ✅ POST - Send bulk SMS
app.post('/send-sms-bulk', async (req, res) => {
  try {
    const { numbers, message } = req.body;

    // Validation
    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "No valid phone numbers provided" 
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Message cannot be empty" 
      });
    }

    // Clean phone numbers
    const validNumbers = numbers
      .map(num => String(num).trim().replace(/\D/g, ''))
      .filter(num => num.length === 10 && /^[6-9]/.test(num));

    if (validNumbers.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "No valid Indian mobile numbers found" 
      });
    }

    console.log(`📤 Sending SMS to ${validNumbers.length} recipients`);

    // Check if API key exists
    if (!process.env.FAST2SMS_API_KEY) {
      console.log('⚠️ TEST MODE - SMS not actually sent (no API key)');
      
      // Log to database anyway
      await prisma.smsLog.create({
        data: {
          message: `[TEST] ${message.trim()}`,
          recipients: validNumbers.length,
          numbers: validNumbers.join(",")
        }
      });

      return res.json({
        success: true,
        totalNumbers: validNumbers.length,
        testMode: true
      });
    }

    // Send SMS via Fast2SMS
    try {
      await fast2sms.sendMessage({
        authorization: process.env.FAST2SMS_API_KEY,
        message: message.trim(),
        numbers: validNumbers
      });

      // Log to database
      await prisma.smsLog.create({
        data: {
          message: message.trim(),
          recipients: validNumbers.length,
          numbers: validNumbers.join(",")
        }
      });

      res.json({
        success: true,
        totalNumbers: validNumbers.length,
        testMode: false
      });

    } catch (smsError) {
      console.error('Fast2SMS Error:', smsError);
      
      await prisma.smsLog.create({
        data: {
          message: `[FAILED] ${message.trim()}`,
          recipients: validNumbers.length,
          numbers: validNumbers.join(",")
        }
      });

      return res.status(500).json({ 
        success: false,
        error: "SMS service error: " + smsError.message 
      });
    }

  } catch (err) {
    console.error("Bulk SMS Error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ✅ GET - SMS History
app.get('/sms-history', async (req, res) => {
  try {
    const logs = await prisma.smsLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET - SMS Statistics
app.get('/sms-stats', async (req, res) => {
  try {
    const totalMessagesSent = await prisma.smsLog.count();
    
    const allLogs = await prisma.smsLog.findMany({
      select: { recipients: true }
    });
    const totalRecipients = allLogs.reduce((sum, log) => sum + log.recipients, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sentToday = await prisma.smsLog.count({
      where: { sentAt: { gte: today } }
    });

    res.json({
      totalMessagesSent,
      totalRecipients,
      sentToday
    });
  } catch (error) {
    console.error('Error fetching SMS stats:', error);
    res.status(500).json({ error: error.message });
  }
});
// ✅ ONE-TIME FIX: Add this endpoint to fix existing birth dates
// Run this once, then remove the endpoint
app.post('/admin/fix-birth-dates', async (req, res) => {
  try {
    console.log('🔧 Starting birth date correction...');
    
    // Get all records with birth dates
    const records = await prisma.familyRecord.findMany({
      where: {
        dateOfBirth: { not: null }
      }
    });

    console.log(`Found ${records.length} records with birth dates`);

    let updatedCount = 0;

    for (const record of records) {
      try {
        const oldDate = new Date(record.dateOfBirth);
        
        // Add 1 day to correct the timezone offset
        const correctedDate = new Date(oldDate);
        correctedDate.setDate(correctedDate.getDate() + 1);
        
        // Update the record
        await prisma.familyRecord.update({
          where: { id: record.id },
          data: {
            dateOfBirth: correctedDate,
            birthdayThisWeek: isBirthdayThisWeek(correctedDate),
            birthdayThisMonth: isBirthdayThisMonth(correctedDate)
          }
        });

        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`✅ Updated ${updatedCount} records...`);
        }
      } catch (error) {
        console.error(`Error updating record ${record.id}:`, error.message);
      }
    }

    console.log(`✅ Completed! Updated ${updatedCount} birth dates`);

    res.json({
      message: 'Birth dates corrected successfully',
      totalRecords: records.length,
      updatedRecords: updatedCount
    });

  } catch (error) {
    console.error('Error fixing birth dates:', error);
    res.status(500).json({ 
      error: 'Failed to fix birth dates',
      details: error.message 
    });
  }
});

// Test the fix - view some corrected records
app.get('/admin/test-dates', async (req, res) => {
  try {
    const samples = await prisma.familyRecord.findMany({
      where: {
        dateOfBirth: { not: null },
        villageName: 'CHENETHACOLONY'
      },
      take: 5,
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        villageName: true
      }
    });

    // Show the dates in IST format
    const formatted = samples.map(r => ({
      ...r,
      dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full'
      }) : null
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🌾 SMART VILLAGE API SERVER 🌾      ║
╠═══════════════════════════════════════╣
║  Status: ✅ Running                    ║
║  Port: ${PORT}                            ║
║  URL: http://localhost:${PORT}           ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});