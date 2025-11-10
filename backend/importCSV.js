const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const prisma = new PrismaClient();

async function importFromCSV(filePath) {
  const records = [];
  
  // Read CSV
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      records.push(row);
    })
    .on('end', async () => {
      console.log(`Found ${records.length} records`);
      
      // Import to database
      for (const row of records) {
        await prisma.user.create({
          data: {
            name: row.name,
            email: row.email,
            // ... map your fields
          }
        });
      }
      
      console.log('Import completed!');
      await prisma.$disconnect();
    });
}

importFromCSV('./data.csv');