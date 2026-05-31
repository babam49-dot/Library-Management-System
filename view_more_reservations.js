const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'controllers', 'reservationsController.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 50; i < 150; i++) {
  if (lines[i]) console.log(`${i + 1}: ${lines[i]}`);
}
