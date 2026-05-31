const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// We want to add the payments item right after the profile item in TABS
const oldProfileTab = "{ key: 'profile', label: 'My Profile', icon: '👤', path: '/staff' },";
const newProfileTab = "{ key: 'profile', label: 'My Profile', icon: '👤', path: '/staff' },\n    { key: 'payments', label: 'Payment History', icon: '🧾', path: '/staff' },";

if (content.includes(oldProfileTab)) {
  content = content.replace(oldProfileTab, newProfileTab);
  console.log('✅ Added payments tab to TABS array');
} else {
  console.error('❌ Could not find oldProfileTab string');
}

fs.writeFileSync(filePath, content, 'utf8');
