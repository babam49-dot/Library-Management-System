const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("tab === 'browse'")) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    // Print next 60 lines
    for (let j = 1; j <= 60; j++) {
      if (lines[i + j]) console.log(`  Line ${i + 1 + j}: ${lines[i + j]}`);
    }
  }
}
