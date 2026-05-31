const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');

const idx = content.indexOf("key: 'profile'");
if (idx !== -1) {
  console.log('Found profile tab context:');
  console.log(content.slice(idx - 200, idx + 200));
} else {
  console.log('Could not find profile tab');
}
