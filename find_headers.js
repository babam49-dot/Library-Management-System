const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('getItem') || lines[i].includes('getHeaders') || lines[i].includes('headers') || lines[i].includes('token') || lines[i].includes('Authorization')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
