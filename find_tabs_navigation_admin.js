const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'AdminDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setTab') || lines[i].includes('activeTab') || lines[i].includes('navItems')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
