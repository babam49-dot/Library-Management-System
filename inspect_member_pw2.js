const fs = require('fs');
const path = require('path');

const memberPath = path.join(__dirname, 'frontend', 'src', 'pages', 'MemberDashboard.jsx');
const content = fs.readFileSync(memberPath, 'utf8');
const lines = content.split('\n');

// Find password-related lines
for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes('password') && (
      lines[i].includes('post') || lines[i].includes('change') || lines[i].includes('handlePw') || lines[i].includes('axios')
  )) {
    const start = Math.max(0, i - 1);
    const end = Math.min(lines.length - 1, i + 2);
    for (let j = start; j <= end; j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
    console.log('---');
  }
}
