const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
const buf = fs.readFileSync(filePath);

console.log('File size in bytes:', buf.length);
try {
  const text = buf.toString('utf8');
  console.log('toString("utf8") succeeded. Length of string:', text.length);
  // Check if there are any null bytes (0x00) or control characters that could mark it as binary
  let nulls = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0) nulls++;
  }
  console.log('Number of null bytes:', nulls);
} catch (err) {
  console.error('toString("utf8") failed:', err);
}
