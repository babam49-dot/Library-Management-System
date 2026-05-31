const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

const regex = /const\s+TABS\s*=\s*\[[\s\S]*?\]/;
const newTABS = `const TABS = [
    { key: 'overview', label: 'Circulation Overview', icon: '📊', path: '/staff' },
    { key: 'myborrow', label: 'My Borrowing', icon: '📖', path: '/staff', badge: pendingMyBorrows },
    { key: 'browse', label: 'Browse Catalog', icon: '📚', path: '/staff' },
    { key: 'catalog', label: 'Register Book', icon: '➕', path: '/staff' },
    { key: 'metadata', label: 'Manage Metadata', icon: '🏷️', path: '/staff' },
    { key: 'fines', label: 'Fine Payments', icon: '💰', path: '/staff' },
    { key: 'desk', label: 'Librarian Desk', icon: '🖥️', path: '/desk' },
    { key: 'reservations', label: 'Reservations', icon: '📋', path: '/reservations' },
    { key: 'overdue', label: 'Overdue Books', icon: '⚠️', path: '/overdue' },
    { key: 'profile', label: 'My Profile', icon: '👤', path: '/staff' },
  ]`;

if (regex.test(content)) {
  content = content.replace(regex, newTABS);
  // Restore windows line endings if they were originally CRLF
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully restored TABS array in StaffDashboard.jsx using regex');
} else {
  console.error('Could not find TABS section in StaffDashboard.jsx');
  process.exit(1);
}
