const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// ✅ Enable CORS for your Netlify frontend
app.use(cors({
  origin: "https://smart-village1.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ✅ File upload configuration for Excel imports
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
});

// ✅ Separate Multer instance for JSON backup restore
const backupUpload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed for backup restore!'), false);
    }
  }
});

// ✅ Root route
app.get('/', (req, res) => {
  res.json({ message: 'Smart Village API is running!' });
});

// ✅ GET - All family records
app.get('/records', async (req, res) => {
  try {
    const records = await prisma.familyRecord.findMany({ orderBy: { id: 'desc' } });
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET - Single record
app.get('/records/:id', async (req, res) => {
  try {
    const record = await prisma.familyRecord.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
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

    const record = await prisma.familyRecord.create({
      data: {
        mandalName,
        villageName,
        name,
        numFamilyPersons: parseInt(numFamilyPersons) || 0,
        gender: gender || null,
        phoneNumber,
        address: address || null
      }
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT - Update record
app.put('/records/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const record = await prisma.familyRecord.update({
      where: { id },
      data: req.body
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE - Remove record
app.delete('/records/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.familyRecord.delete({ where: { id } });
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Import Excel file route
app.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    let imported = 0, skipped = 0;

    for (const row of data) {
      try {
        const existing = await prisma.familyRecord.findFirst({
          where: {
            name: String(row['NAME'] || '').trim(),
            phoneNumber: String(row['PHONE NUMBER'] || '').trim()
          }
        });

        if (existing) { skipped++; continue; }

        await prisma.familyRecord.create({
          data: {
            mandalName: String(row['MANADAL NAME'] || '').trim(),
            villageName: String(row['VILLAGE NAME'] || '').trim(),
            name: String(row['NAME'] || '').trim(),
            numFamilyPersons: parseInt(row['NUMBER OF FAMILY PERSONS']) || 0,
            gender: String(row['GENDER'] || '').trim(),
            phoneNumber: String(row['PHONE NUMBER'] || '').trim(),
            address: String(row['ADDRESS'] || '').trim()
          }
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    fs.unlinkSync(req.file.path);
    res.json({ message: 'Excel import complete', imported, skipped });
  } catch (error) {
    console.error('Error importing Excel:', error);
    res.status(500).json({ error: 'Failed to import Excel data' });
  }
});

// ✅ Export backup
app.get('/backup/export', async (req, res) => {
  try {
    const records = await prisma.familyRecord.findMany({ orderBy: { id: 'asc' } });
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

// ✅ Restore backup (JSON)
app.post('/backup/restore', backupUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No backup file uploaded' });

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const backupData = JSON.parse(fileContent);
    if (!backupData.data || !Array.isArray(backupData.data)) {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }

    let restoredCount = 0, skippedCount = 0, errorCount = 0;

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
        if (existing) { skippedCount++; continue; }

        if (recordData.dateOfBirth) {
          recordData.dateOfBirth = new Date(recordData.dateOfBirth);
        }

        await prisma.familyRecord.create({ data: recordData });
        restoredCount++;
      } catch (err) {
        errorCount++;
        console.error('Restore error:', err.message);
      }
    }

    fs.unlinkSync(req.file.path);
    res.json({
      message: 'Backup restore completed successfully.',
      totalInBackup: backupData.data.length,
      restoredRecords: restoredCount,
      skippedDuplicates: skippedCount,
      errors: errorCount
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup.', details: error.message });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🌾 SMART VILLAGE API SERVER 🌾      ║
╠════════════════════════════════════════╣
║  Status: ✅ Running                    ║
║  Port: ${PORT}                             ║
║  URL: http://localhost:${PORT}             ║
╚════════════════════════════════════════╝
`);
});

// ✅ Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
