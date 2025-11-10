const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

// Helper function to parse date from your Excel format (DD-MM-YYYY)
function parseExcelDate(dateString) {
  if (!dateString) return null;
  
  try {
    // Handle DD-MM-YYYY format like "01-01-1973"
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const [day, month, year] = dateString.split('-');
      const date = new Date(`${year}-${month}-${day}`);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // If it's already a Date object
    if (dateString instanceof Date) {
      return dateString;
    }
    
    // If it's an Excel serial number
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
  
  // Set same year for comparison
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

// Helper function to check if record already exists
async function isDuplicate(record) {
  const existing = await prisma.familyRecord.findFirst({
    where: {
      AND: [
        { mandalName: record.mandalName },
        { villageName: record.villageName },
        { name: record.name },
        { phoneNumber: record.phoneNumber }
      ]
    }
  });
  
  return existing !== null;
}

async function importFamilyRecords(excelFilePath) {
  try {
    console.log('Reading Excel file...');
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${rawData.length} records in Excel file`);
    console.log(`Sheet name: ${sheetName}\n`);
    
    // Transform data to match Prisma schema
    const transformedData = rawData.map((row, index) => {
      const dateOfBirth = parseExcelDate(row['DATE OF BIRTH']);
      
      return {
        mandalName: String(row['MANADAL NAME'] || '').trim(),
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
    const validData = transformedData.filter((record, index) => {
      if (!record.mandalName || !record.villageName || !record.name || !record.address || !record.phoneNumber) {
        console.warn(`⚠️  Row ${index + 2}: Skipping invalid record (missing required fields):`, {
          name: record.name,
          village: record.villageName,
          mandal: record.mandalName,
          address: record.address,
          phone: record.phoneNumber
        });
        return false;
      }
      return true;
    });
    
    console.log(`\n✅ Validated ${validData.length} records out of ${transformedData.length}`);
    console.log(`❌ Skipped ${transformedData.length - validData.length} invalid records\n`);
    
    if (validData.length === 0) {
      console.log('❌ No valid records to import!');
      return;
    }
    
    console.log('Checking for duplicates...\n');
    
    // Check for duplicates and import
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < validData.length; i++) {
      const record = validData[i];
      
      try {
        // Check if duplicate exists
        const isDup = await isDuplicate(record);
        
        if (isDup) {
          duplicateCount++;
          console.log(`⏭️  Skipped duplicate: ${record.name} (${record.villageName})`);
          continue;
        }
        
        // Import new record
        await prisma.familyRecord.create({
          data: record
        });
        successCount++;
        
        // Show progress every 5 records
        if (successCount % 5 === 0) {
          console.log(`✓ Imported ${successCount} new records...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error importing record ${i + 1} (${record.name}):`, error.message);
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Import completed!`);
    console.log(`   - Successfully imported: ${successCount} NEW records`);
    console.log(`   - Duplicates skipped: ${duplicateCount} records`);
    console.log(`   - Failed: ${errorCount} records`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Show statistics
    const totalRecords = await prisma.familyRecord.count();
    const birthdaysThisWeek = await prisma.familyRecord.count({
      where: { birthdayThisWeek: true }
    });
    const birthdaysThisMonth = await prisma.familyRecord.count({
      where: { birthdayThisMonth: true }
    });
    
    console.log(`📊 Database Statistics:`);
    console.log(`   - Total family records: ${totalRecords}`);
    console.log(`   - Birthdays this week: ${birthdaysThisWeek}`);
    console.log(`   - Birthdays this month: ${birthdaysThisMonth}`);
    
    // Show sample of newly imported records
    if (successCount > 0) {
      const sampleRecords = await prisma.familyRecord.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          villageName: true,
          mandalName: true,
          phoneNumber: true,
          numFamilyPersons: true,
          dateOfBirth: true
        }
      });
      
      console.log('\n📋 Sample of newly imported records:');
      console.table(sampleRecords);
    }
    
  } catch (error) {
    console.error('❌ Error importing data:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Update this path to your Excel file
const excelFilePath = './P.KONDAPURAM.xlsx';

console.log('='.repeat(60));
console.log('   FAMILY RECORDS IMPORT TOOL (WITH DUPLICATE CHECK)');
console.log('='.repeat(60));
console.log(`File: ${excelFilePath}\n`);

importFamilyRecords(excelFilePath);