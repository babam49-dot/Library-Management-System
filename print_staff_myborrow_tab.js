const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("tab === 'myborrow'")) {
    found = true;
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    // Print next 80 lines
    for (let j = 1; j <= 80; j++) {
      if (lines[i + j]) console.log(`  Line ${i + 1 + j}: ${lines[i + j]}`);
    }
    break;
  }
}

if (!found) {
  console.log('Could not find tab === myborrow render');
}
