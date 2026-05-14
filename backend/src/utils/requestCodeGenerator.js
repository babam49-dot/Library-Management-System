const db = require('../db');

/**
 * Generates unique RequestCode in format BR-NNNN.
 * Wrapped in a transaction lock.
 */
async function generateRequestCode(connection) {
  const queryRunner = connection || db;
  
  try {
    // 1. Query MAX(RequestCode) FROM BorrowingRecords
    const [rows] = await queryRunner.query(`
      SELECT MAX(RequestCode) as maxCode FROM BorrowingRecords WHERE RequestCode LIKE 'BR-%'
    `);
    
    let maxCode = rows[0].maxCode;
    let nextNum = 1;
    
    if (maxCode) {
      // 2. Parse numeric part
      const numPart = maxCode.replace('BR-', '');
      const parsedNum = parseInt(numPart, 10);
      if (!isNaN(parsedNum)) {
        // 3. Increment by 1
        nextNum = parsedNum + 1;
      }
    }
    
    // 4. Zero-pad to 4 digits minimum
    const paddedNum = String(nextNum).padStart(4, '0');
    
    // 5. Return new code
    return `BR-${paddedNum}`;
  } catch (err) {
    console.error("Error generating RequestCode:", err);
    throw new Error('Failed to generate request code');
  }
}

module.exports = {
  generateRequestCode
};
