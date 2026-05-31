const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'frontend', 'src', 'pages', 'MemberDashboard.jsx'),
  path.join(__dirname, 'frontend', 'src', 'components', 'DashboardShell.jsx')
];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  const lines = content.split(/\r?\n/);
  const result = [];
  let inHead = false;
  let inOther = false;

  for (const line of lines) {
    if (line.startsWith('<<<<<<< HEAD')) {
      inHead = true;
      inOther = false;
      continue;
    } else if (line.startsWith('=======')) {
      inHead = false;
      inOther = true;
      continue;
    } else if (line.startsWith('>>>>>>>')) {
      inHead = false;
      inOther = false;
      continue;
    }

    if (!inOther) {
      result.push(line);
    }
  }

  fs.writeFileSync(filePath, result.join('\n'), 'utf8');
  console.log(`Resolved conflicts in ${path.basename(filePath)} successfully.`);
}
