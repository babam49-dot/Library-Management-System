const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace garbled emoji/icons in TABS array
content = content.replace(/icon:\s*['"`]ðŸ“Š['"`]/g, "icon: '📊'");
content = content.replace(/icon:\s*['"`]ðŸ“š['"`]/g, "icon: '📚'");
content = content.replace(/icon:\s*['"`]âž•['"`]/g, "icon: '➕'");
content = content.replace(/icon:\s*['"`]ðŸ\s*·ï¸\s*['"`]/g, "icon: '🏷️'");
content = content.replace(/icon:\s*['"`]ðŸ\s*·ï¸['"`]/g, "icon: '🏷️'");
content = content.replace(/icon:\s*['"`]ðŸ’°['"`]/g, "icon: '💰'");
content = content.replace(/icon:\s*['"`]ðŸ–¥ï¸\s*['"`]/g, "icon: '🖥️'");
content = content.replace(/icon:\s*['"`]ðŸ–¥ï¸['"`]/g, "icon: '🖥️'");
content = content.replace(/icon:\s*['"`]ðŸ“‹['"`]/g, "icon: '📋'");
content = content.replace(/icon:\s*['"`]âš\s* ï¸\s*['"`]/g, "icon: '⚠️'");
content = content.replace(/icon:\s*['"`]âš ï¸['"`]/g, "icon: '⚠️'");
content = content.replace(/icon:\s*['"`]ðŸ‘¤['"`]/g, "icon: '👤'");

// In case there are other garbled ones or let's do a direct replacement of the TABS array definition
content = content.replace(/icon:\s*['"`][^'"`]*Š[^'"`]*['"`]/g, "icon: '📊'");
content = content.replace(/icon:\s*['"`][^'"`]*š[^'"`]*['"`]/g, "icon: '📚'");

// Also let's check for any other non-English or garbled characters in the file and fix them.
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully cleaned up garbled icons/emojis in StaffDashboard.jsx');
