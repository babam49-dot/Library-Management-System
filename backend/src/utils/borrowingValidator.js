const db = require('../db');

const LIBRARY_FINE_THRESHOLD = Number(process.env.FINE_THRESHOLD || 100.00);

async function validateDebtCheck(memberId, connection) {
  const queryRunner = connection || db;
  
  try {
    const [rows] = await queryRunner.query(`
      SELECT COALESCE(SUM(Amount),0) as total FROM Fines
      WHERE MemberID = ? AND FineStatus IN ('Unpaid', 'Partial')
    `, [memberId]);
    
    const unpaidTotal = rows[0].total || 0;
    
    if (Number(unpaidTotal) > LIBRARY_FINE_THRESHOLD) {
      return { 
        passed: false, 
        message: `You have unpaid fines of ETB ${unpaidTotal}. Please settle your balance before borrowing.`, 
        code: "DEBT_BLOCK",
        unpaidTotal
      };
    }
    
    return { passed: true, unpaidTotal };
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      // Fines table might not exist until Module 4, assume passed for now
      return { passed: true, unpaidTotal: 0 };
    }
    console.error("Error in validateDebtCheck:", err);
    throw new Error("Failed to validate debt");
  }
}

async function validateQuantityCheck(memberId, requestedCount, connection) {
  const queryRunner = connection || db;
  
  try {
    const [borrowRows] = await queryRunner.query(`
      SELECT COUNT(*) as activeBorrows FROM BorrowingRecords
      WHERE MemberID = ? AND Status IN ('Pending', 'Borrowed')
    `, [memberId]);
    
    const activeBorrows = borrowRows[0].activeBorrows || 0;
    
    const [memberRows] = await queryRunner.query(`
      SELECT MaxBooksAllowed FROM Members WHERE MemberID = ?
    `, [memberId]);
    
    if (memberRows.length === 0) {
      return { passed: false, message: "Member not found", code: "NOT_FOUND" };
    }
    
    const maxBooksAllowed = memberRows[0].MaxBooksAllowed || 5; // Default to 5 if null
    
    if (activeBorrows + requestedCount > maxBooksAllowed) {
      return { 
        passed: false, 
        message: `This request would exceed your borrow limit of ${maxBooksAllowed} books. (Active: ${activeBorrows}, Requested: ${requestedCount})`, 
        code: "LIMIT_EXCEEDED" 
      };
    }
    
    return { passed: true, activeBorrows, maxBooksAllowed };
  } catch (err) {
    console.error("Error in validateQuantityCheck:", err);
    throw new Error("Failed to validate quantity");
  }
}

module.exports = {
  validateDebtCheck,
  validateQuantityCheck
};
