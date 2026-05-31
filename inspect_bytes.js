const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Manage Metadata') || lines[i].includes('Show Passwords') || lines[i].includes('Looking up')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
    console.log(Buffer.from(lines[i]).toString('hex'));
    console.log('---');
  }
}
