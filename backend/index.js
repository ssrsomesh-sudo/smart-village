// Trigger redeploy to apply Prisma migrations
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'https://smart-village1.netlify.app',
    'https://smart-village1.netlify.app/'
  ],
  credentials: true
}));

app.use(express.json());

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
});

// Helper function to parse date from Excel format (DD-MM-YYYY)
function parseExcelDate(dateString) {
  if (!dateString) return null;
  
  try {
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const [day, month, year] = dateString.split('-');
      const date = new Date(`${year}-${month}-${day}`);
      return isNaN(date.getTime()) ? null : date;
    }
    
    if (dateString instanceof Date) {
      return dateString;
    }
    
    if (typeof dateString === 'number') {
      const date = new Date((dateString - 25569) * 86400 * 1000);
      return date;
    }
    
    return null;
  } catch (error) {
    console.warn(`Could not parse date: ${dateString}`);
    return null;
  }
}

// Helper function to check if birthday is this week
function isBirthdayThisWeek(dateOfBirth) {
  if (!dateOfBirth) return false;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  dob.setFullYear(today.getFullYear());
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);
  return dob >= today && dob <= weekFromNow;
}

// Helper function to check if birthday is this month
function isBirthdayThisMonth(dateOfBirth) {
  if (!dateOfBirth) return false;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  return dob.getMonth() === today.getMonth();
}

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Smart Village API is running!' });
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

    console.log(`Found ${rawData.length} records in Excel file`);

    // Transform data to match Prisma schema
    const transformedData = rawData.map((row) => {
      const dateOfBirth = parseExcelDate(row['DATE OF BIRTH']);
      
      return {
        mandalName: String(row['MANADAL NAME'] || row['MANDAL NAME'] || '').trim(),
        villageName: String(row['VILLAGE NAME'] || '').trim(),
        rationCard: row['RATION CARD'] ? String(row['RATION CARD']) : null,
        voterCard: row['VOTER CARD'] ? String(row['VOTER CARD']) : null,
        name: String(row['NAME'] || '').trim(),
        numFamilyPersons: parseInt(row['NUMBER OF FAMILY PERSONS']) || 0,
        address: String(row['ADDRESS'] || '').trim(),
        phoneNumber: String(row['PHONE NUMBER'] || '').trim(),
        aadhar: row['AADHAR'] ? String(row['AADHAR']) : null,
        gender: row['GENDER'] ? String(row['GENDER']).trim() : null,
        dateOfBirth: dateOfBirth,
        qualification: row['QUALIFICATION'] ? String(row['QUALIFICATION']).trim() : null,
        caste: row['Caste'] ? String(row['Caste']).trim() : null,
        subCaste: row['Sub Caste'] ? String(row['Sub Caste']).trim() : null,
        occupation: row['OCCUPATION'] ? String(row['OCCUPATION']).trim() : null,
        needEmployment: row['NEED ANY EMPLOYEEMENT'] ? String(row['NEED ANY EMPLOYEEMENT']).trim() : null,
        arogyasriCardNumber: row['AROGYASRI CARD NUMBER'] ? String(row['AROGYASRI CARD NUMBER']).trim() : null,
        shgMember: row['SHG MEMBER'] ? String(row['SHG MEMBER']).trim() : null,
        schemesEligible: row['SCHEMES ELIGIBLE FOR'] ? String(row['SCHEMES ELIGIBLE FOR']).trim() : null,
        remarks: null,
        birthdayThisWeek: dateOfBirth ? isBirthdayThisWeek(dateOfBirth) : false,
        birthdayThisMonth: dateOfBirth ? isBirthdayThisMonth(dateOfBirth) : false,
      };
    });

    // Validate required fields
    const validData = transformedData.filter((record) => {
      return record.mandalName && record.villageName && record.name && record.address && record.phoneNumber;
    });

    console.log(`Validated ${validData.length} records out of ${transformedData.length}`);

    if (validData.length === 0) {
      return res.status(400).json({ error: 'No valid records found in Excel file' });
    }

    // Import records with duplicate checking
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const record of validData) {
      try {
        // Check if duplicate exists
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

        // Create new record
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

// ✅ GET - Get all family records
app.get('/records', async (req, res) => {
  try {
    const records = await prisma.familyRecord.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
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

    const existingRecord = await prisma.familyRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }

    await prisma.familyRecord.delete({
      where: { id }
    });

    res.json({ message: 'Record deleted successfully', id });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET - Get statistics
app.get('/stats', async (req, res) => {
  try {
    const totalRecords = await prisma.familyRecord.count();
    const totalMandals = await prisma.familyRecord.groupBy({
      by: ['mandalName'],
    });
    const totalVillages = await prisma.familyRecord.groupBy({
      by: ['villageName'],
    });
    const birthdaysThisWeek = await prisma.familyRecord.count({
      where: { birthdayThisWeek: true }
    });
    const birthdaysThisMonth = await prisma.familyRecord.count({
      where: { birthdayThisMonth: true }
    });

    res.json({
      totalRecords,
      totalMandals: totalMandals.length,
      totalVillages: totalVillages.length,
      birthdaysThisWeek,
      birthdaysThisMonth
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
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