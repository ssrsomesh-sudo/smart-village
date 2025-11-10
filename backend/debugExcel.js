const XLSX = require('xlsx');

// This script will show us the actual column names in your Excel file
function debugExcelFile(excelFilePath) {
  try {
    console.log('Reading Excel file...');
    
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`\nSheet name: ${sheetName}`);
    
    // Get the data
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`\nTotal rows found: ${rawData.length}`);
    
    if (rawData.length > 0) {
      console.log('\n📋 ACTUAL COLUMN NAMES IN YOUR EXCEL FILE:');
      console.log('==========================================');
      const columns = Object.keys(rawData[0]);
      columns.forEach((col, index) => {
        console.log(`${index + 1}. "${col}"`);
      });
      
      console.log('\n📊 FIRST ROW DATA (SAMPLE):');
      console.log('==========================');
      console.log(rawData[0]);
      
      console.log('\n📊 SECOND ROW DATA (SAMPLE):');
      console.log('===========================');
      if (rawData.length > 1) {
        console.log(rawData[1]);
      }
    } else {
      console.log('\n⚠️  No data found in Excel file!');
      console.log('Make sure your Excel file has:');
      console.log('1. A header row with column names');
      console.log('2. At least one row of data');
    }
    
  } catch (error) {
    console.error('❌ Error reading file:', error.message);
  }
}

// Update this to your Excel file path
const excelFilePath = './PASALURU.xlsx';

debugExcelFile(excelFilePath);