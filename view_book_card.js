const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'BookCard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
console.log(content);
