const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

// ========== CONFIGURATION OPTIONS ==========
const IMPORT_OPTIONS = {
  // Choose duplicate handling strategy:
  // 'skip' - Skip duplicates (default)
  // 'update' - Update existing records with new data
  // 'error' - Show error and stop import
  duplicateStrategy: 'skip',
  
  // Define which fields to use for duplicate detection
  duplicateCheckFields: ['mandalName', 'villageName', 'name', 'phoneNumber'],
  
  // Show detailed logs
  verbose: true
};
// ===========================================

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
    return null;
  }
}

function isBirthdayThisWeek(dateOfBirth) {
  if (!dateOfBirth) return false;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  dob.setFullYear(today.getFullYear());
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);
  return dob >= today && dob <= weekFromNow;
}

function isBirthdayThisMonth(dateOfBirth) {
  if (!dateOfBirth) return false;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  return dob.getMonth() === today.getMonth();
}

async function findDuplicate(record) {
  const whereConditions = {};
  
  IMPORT_OPTIONS.duplicateCheckFields.forEach(field => {
    whereConditions[field] = record[field];
  });
  
  return await prisma.familyRecord.findFirst({
    where: whereConditions
  });
}

async function importWithOptions(excelFilePath) {
  try {
    console.log('📖 Reading Excel file...');
    
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`\n✅ Found ${rawData.length} records in sheet: ${sheetName}`);
    console.log(`⚙️  Duplicate Strategy: ${IMPORT_OPTIONS.duplicateStrategy}`);
    console.log(`🔍 Checking duplicates using: ${IMPORT_OPTIONS.duplicateCheckFields.join(', ')}\n`);
    
    const transformedData = rawData.map(row => {
      const dateOfBirth = parseExcelDate(row['DATE OF BIRTH']);
      
      return {
        mandalName: String(row['MANDAL NAME'] || '').trim(),
        villageName: String(row['VILLAGE NAME'] || '').trim(),
        rationCard: row['RATION CARD'] ? String(row['RATION CARD']) : null,
        voterCard: row['VOTER CARD'] ? String(row['VOTER CARD']) : null,
        name: String(row['NAME OF THE PERSON'] || '').trim(),
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
    
    const validData = transformedData.filter(record => {
      return record.mandalName && record.villageName && record.name && record.phoneNumber;
    });
    
    console.log(`✅ Valid records: ${validData.length}`);
    console.log(`❌ Invalid records: ${transformedData.length - validData.length}\n`);
    
    if (validData.length === 0) {
      console.log('❌ No valid records to import!');
      return;
    }
    
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    console.log('🚀 Starting import process...\n');
    
    for (let i = 0; i < validData.length; i++) {
      const record = validData[i];
      
      try {
        const existing = await findDuplicate(record);
        
        if (existing) {
          // Duplicate found
          if (IMPORT_OPTIONS.duplicateStrategy === 'skip') {
            skippedCount++;
            if (IMPORT_OPTIONS.verbose) {
              console.log(`⏭️  [${i + 1}/${validData.length}] Skipped: ${record.name} - Already exists`);
            }
            continue;
          } else if (IMPORT_OPTIONS.duplicateStrategy === 'update') {
            // Update existing record
            await prisma.familyRecord.update({
              where: { id: existing.id },
              data: record
            });
            updatedCount++;
            if (IMPORT_OPTIONS.verbose) {
              console.log(`🔄 [${i + 1}/${validData.length}] Updated: ${record.name}`);
            }
          } else if (IMPORT_OPTIONS.duplicateStrategy === 'error') {
            console.error(`❌ Duplicate found: ${record.name}. Stopping import.`);
            break;
          }
        } else {
          // New record - insert
          await prisma.familyRecord.create({
            data: record
          });
          insertedCount++;
          if (IMPORT_OPTIONS.verbose && insertedCount % 5 === 0) {
            console.log(`✅ [${i + 1}/${validData.length}] Inserted ${insertedCount} new records...`);
          }
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${record.name}:`, error.message);
      }
    }
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`                    📊 IMPORT SUMMARY`);
    console.log(`${'='.repeat(70)}`);
    console.log(`✅ New records inserted:    ${insertedCount}`);
    console.log(`🔄 Existing records updated: ${updatedCount}`);
    console.log(`⏭️  Duplicates skipped:      ${skippedCount}`);
    console.log(`❌ Errors:                   ${errorCount}`);
    console.log(`${'='.repeat(70)}\n`);
    
    const totalRecords = await prisma.familyRecord.count();
    console.log(`📈 Total records in database: ${totalRecords}\n`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// ========== USAGE ==========
const excelFilePath = './PASALURU.xlsx';

console.log(`
╔════════════════════════════════════════════════════════════════╗
║          SMART VILLAGE - ADVANCED IMPORT TOOL                  ║
╠════════════════════════════════════════════════════════════════╣
║  File: ${excelFilePath.padEnd(56)} ║
║  Strategy: ${IMPORT_OPTIONS.duplicateStrategy.toUpperCase().padEnd(52)} ║
╚════════════════════════════════════════════════════════════════╝
`);

importWithOptions(excelFilePath);