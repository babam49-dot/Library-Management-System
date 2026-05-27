const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'index.js');
const content = fs.readFileSync(filePath, 'utf8');
console.log(content.split('\n').filter(l => l.includes('member') || l.includes('borrowing')).join('\n'));
