const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx'),
  path.join(__dirname, 'frontend', 'src', 'pages', 'MemberDashboard.jsx'),
  path.join(__dirname, 'frontend', 'src', 'pages', 'AdminDashboard.jsx')
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`${path.basename(file)}:`);
  console.log('  Includes useLocation:', content.includes('useLocation'));
}
