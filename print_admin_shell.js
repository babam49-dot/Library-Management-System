const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'AdminDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 545; i < 575; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
