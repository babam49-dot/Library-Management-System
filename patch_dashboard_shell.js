const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'DashboardShell.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace import statement
const oldImport = "import { Link } from 'react-router-dom'";
const newImport = "import { Link, useNavigate, useLocation } from 'react-router-dom'";
if (content.includes(oldImport)) {
  content = content.replace(oldImport, newImport);
} else {
  console.error("Link import not found!");
}

// Add useNavigate and useLocation calls
const oldState = "const [sidebarOpen, setSidebarOpen] = useState(true)";
const newState = "const [sidebarOpen, setSidebarOpen] = useState(true)\n  const navigate = useNavigate()\n  const location = useLocation()";
if (content.includes(oldState)) {
  content = content.replace(oldState, newState);
} else {
  console.error("sidebarOpen state not found!");
}

// Update the click handler on the sidebar button
const oldOnClick = "onClick={() => setTab && setTab(item.key)}";
const newOnClick = `onClick={() => {
                if (item.path && item.path !== location.pathname) {
                  navigate(item.path, { state: { tab: item.key } })
                } else if (setTab) {
                  setTab(item.key)
                }
              }}`;

if (content.includes(oldOnClick)) {
  content = content.replace(oldOnClick, newOnClick);
} else {
  console.error("button onClick not found!");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched DashboardShell.jsx!');
