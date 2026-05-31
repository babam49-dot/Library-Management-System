const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = "Authorization: `Bearer ${localStorage.getItem('token')}`";
const replacementStr = "Authorization: `Bearer ${localStorage.getItem('lms_token')}`";

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully fixed authorization token key in StaffDashboard.jsx!');
} else {
  console.error('Target token string not found in StaffDashboard.jsx');
  process.exit(1);
}
