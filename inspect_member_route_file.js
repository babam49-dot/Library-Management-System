const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'routes', 'member.js');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(content.slice(0, 1000));
} else {
  console.log('member.js route file not found at ' + filePath);
}
