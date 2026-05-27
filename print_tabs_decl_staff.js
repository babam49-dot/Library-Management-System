const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const idx = content.indexOf("key: 'profile'");
if (idx !== -1) {
  // Let's find the start of this array by searching backwards for '['
  let startIdx = idx;
  while (startIdx > 0 && content[startIdx] !== '[') {
    startIdx--;
  }
  // Print 20 lines before and after startIdx
  const startLine = content.slice(0, startIdx).split('\n').length;
  console.log(`Array starts around line ${startLine}:`);
  for (let i = Math.max(0, startLine - 10); i < Math.min(lines.length, startLine + 15); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
