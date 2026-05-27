const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'index.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('require(') || lines[i].includes('.use(')) {
    console.log(`${i + 1}: ${lines[i].trim()}`);
  }
}
