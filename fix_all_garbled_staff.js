const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// String replacement dictionary
const map = {
  'ðŸ ·ï¸ ': '🏷️',
  'ðŸ–¼ï¸ ': '🖼️',
  'ðŸ” ': '🔍',
  'ðŸ ¢': '🏢',
  'ðŸ“ ': '📝',
  'ðŸš€': '🚀',
  'ðŸ–¨ï¸ ': '🖨️',
  'ðŸ‘ ': '👁️',
  'â ³': '⏳'
};

for (const [garbled, clean] of Object.entries(map)) {
  content = content.split(garbled).join(clean);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully replaced remaining garbled symbols.');
