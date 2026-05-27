const fs = require('fs');
const path = require('path');

// ── Fix 1: 5-minute timeout for member (RoleID=3) borrowing requests ──────────
const borrowingPath = path.join(__dirname, 'backend', 'src', 'controllers', 'borrowingController.js');
let borrowingContent = fs.readFileSync(borrowingPath, 'utf8');

// Add roleID extraction after memberId
const oldMemberIdLine = `  const { copyIds } = req.body;\r\n  const memberId = req.user.MemberID || req.user.memberID || req.user.extensionId;`;
const newMemberIdLine = `  const { copyIds } = req.body;\r\n  const memberId = req.user.MemberID || req.user.memberID || req.user.extensionId;\r\n  const roleId = req.user.RoleID || req.user.roleID || 3; // 1=Admin, 2=Staff, 3=Member\r\n  // Members (RoleID=3) get a 5-minute pickup window; staff/admin get 30 minutes\r\n  const pickupInterval = roleId === 3 ? 'INTERVAL 5 MINUTE' : 'INTERVAL 30 MINUTE';\r\n  const pickupMs = roleId === 3 ? 5 * 60 * 1000 : 30 * 60 * 1000;`;

if (borrowingContent.includes(oldMemberIdLine)) {
  borrowingContent = borrowingContent.replace(oldMemberIdLine, newMemberIdLine);
  console.log('✅ Added roleId and pickupInterval variables');
} else {
  console.error('❌ Could not find memberId extraction line');
}

// Update the INSERT in submitRequest to use dynamic interval
const oldInsertPending = `          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)\r\n          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), INTERVAL 30 MINUTE))`;
const newInsertPending = `          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)\r\n          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), ${'\'+pickupInterval+\''}))`;

// That won't work directly - need to use template literals in the actual code
// Instead patch the whole query block
const oldQueryBlock = `        await conn.query(\`
          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)
          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), INTERVAL 30 MINUTE))
        \`, [memberId, copyId, requestCode]);`;
const newQueryBlock = `        await conn.query(\`
          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)
          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), \${pickupInterval}))
        \`, [memberId, copyId, requestCode]);`;

if (borrowingContent.includes(oldQueryBlock)) {
  borrowingContent = borrowingContent.replace(oldQueryBlock, newQueryBlock);
  console.log('✅ Updated BorrowingRecords INSERT with dynamic interval');
} else {
  // Try CRLF version
  const oldQueryBlockCRLF = "        await conn.query(`\r\n          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)\r\n          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), INTERVAL 30 MINUTE))\r\n        `, [memberId, copyId, requestCode]);";
  const newQueryBlockCRLF = "        await conn.query(`\r\n          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)\r\n          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), ${pickupInterval}))\r\n        `, [memberId, copyId, requestCode]);";

  if (borrowingContent.includes(oldQueryBlockCRLF)) {
    borrowingContent = borrowingContent.replace(oldQueryBlockCRLF, newQueryBlockCRLF);
    console.log('✅ Updated BorrowingRecords INSERT with dynamic interval (CRLF)');
  } else {
    console.error('❌ Could not find BorrowingRecords INSERT to patch — dumping context:');
    const idx = borrowingContent.indexOf('VALUES (?, ?, ?, CURDATE()');
    if (idx !== -1) {
      console.log('Found at idx:', idx);
      console.log(JSON.stringify(borrowingContent.slice(idx-100, idx+200)));
    }
  }
}

// Update the pickupDeadline in response to use pickupMs
const oldDeadlineResponse = `pickupDeadline: pending.length > 0 ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null,`;
const newDeadlineResponse = `pickupDeadline: pending.length > 0 ? new Date(Date.now() + pickupMs).toISOString() : null,`;

if (borrowingContent.includes(oldDeadlineResponse)) {
  borrowingContent = borrowingContent.replace(oldDeadlineResponse, newDeadlineResponse);
  console.log('✅ Updated pickupDeadline in response');
} else {
  console.error('❌ Could not find pickupDeadline in response');
}

fs.writeFileSync(borrowingPath, borrowingContent, 'utf8');
console.log('✅ borrowingController.js updated successfully');

// ── Fix 2: Add payment-history endpoint to staff.js ───────────────────────────
const staffPath = path.join(__dirname, 'backend', 'src', 'routes', 'staff.js');
let staffContent = fs.readFileSync(staffPath, 'utf8');

const paymentHistoryRoute = `
// GET /api/staff/payment-history — payment history visible to staff
router.get('/payment-history', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(\`
      SELECT p.PaymentID, p.AmountPaid, p.PaymentMethod, p.PaymentReference, p.PaymentStatus, p.PaymentDate,
             f.FineID, ft.TypeName as FineType,
             m.MemberID, m.StudentID, u.FullName as MemberName,
             s.FullName as ProcessedBy
      FROM Payments p
      JOIN Fines f ON f.FineID = p.FineID
      LEFT JOIN FineTypes ft ON ft.TypeID = f.FineTypeID
      JOIN Members m ON m.MemberID = p.MemberID
      JOIN Users u ON u.UserID = m.UserID
      LEFT JOIN Staff st ON st.StaffID = p.ProcessedByStaffID
      LEFT JOIN Users s ON s.UserID = st.UserID
      WHERE p.PaymentStatus = 'Completed'
      ORDER BY p.PaymentDate DESC LIMIT 200
    \`);
    return ok(res, 'Payment History', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

`;

if (!staffContent.includes('/api/staff/payment-history')) {
  // Insert before module.exports
  staffContent = staffContent.replace('module.exports = router;', paymentHistoryRoute + 'module.exports = router;');
  fs.writeFileSync(staffPath, staffContent, 'utf8');
  console.log('✅ Added payment-history endpoint to staff.js');
} else {
  console.log('ℹ️  payment-history already exists in staff.js');
}

console.log('\nAll backend patches complete.');
