const fs = require('fs');
const path = require('path');

// ── MemberDashboard.jsx - check password change section ──────────────────────
const memberPath = path.join(__dirname, 'frontend', 'src', 'pages', 'MemberDashboard.jsx');
const mContent = fs.readFileSync(memberPath, 'utf8');
const mLines = mContent.split('\n');

for (let i = 0; i < mLines.length; i++) {
  if (mLines[i].includes('change-password') || mLines[i].includes('changePassword') || mLines[i].includes('newPassword') || mLines[i].includes('handlePw') || mLines[i].includes('password') && mLines[i].includes('post')) {
    console.log(`Line ${i + 1}: ${mLines[i].trim()}`);
  }
}
