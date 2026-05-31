const fs = require('fs');
const path = require('path');

const staffPath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
const content = fs.readFileSync(staffPath, 'utf8');
const lines = content.split('\n');

// Print lines 1340-1395 (password change handler)
for (let i = 1340; i < 1395; i++) {
  if (lines[i]) console.log(`${i + 1}: ${lines[i]}`);
}
