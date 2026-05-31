const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("tab === 'browse'")) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    // Print lines from i to i + 100
    for (let j = 0; j < 100; j++) {
      if (lines[i + j]) console.log(`  ${i + 1 + j}: ${lines[i + j]}`);
    }
    break;
  }
}
