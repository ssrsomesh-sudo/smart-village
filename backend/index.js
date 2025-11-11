// Trigger redeploy to apply Prisma migrations
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

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
// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Smart Village API is running!' });
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

    // Validation
    if (!mandalName || !villageName || !name || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
 // 🔹 Check if record already exists (by key family details)
    const existing = await prisma.familyRecord.findFirst({
      where: {
        mandalName: mandalName.trim(),
        villageName: villageName.trim(),
        name: name.trim(),
        phoneNumber: phoneNumber.trim()
      },
    });

    if (existing) {
      // Return success message (but no new record)
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

    // Check if record exists
    const existingRecord = await prisma.familyRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Update record
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

    // Check if record exists
    const existingRecord = await prisma.familyRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Delete record
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
╔════════════════════════════════════════╗
║   🌾 SMART VILLAGE API SERVER 🌾      ║
╠════════════════════════════════════════╣
║  Status: ✅ Running                    ║
║  Port: ${PORT}                            ║
║  URL: http://localhost:${PORT}           ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});