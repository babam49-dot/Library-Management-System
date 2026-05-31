const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'MemberDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onReserve') || lines[i].includes('reserveBook')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
