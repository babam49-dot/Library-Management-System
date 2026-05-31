const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace import statement to add useLocation
const oldImport = "import React, { useEffect, useState, useRef } from 'react'";
const newImport = "import React, { useEffect, useState, useRef } from 'react'\nimport { useLocation } from 'react-router-dom'";
if (content.includes(oldImport)) {
  content = content.replace(oldImport, newImport);
} else {
  console.error("React import not found!");
}

// Add useLocation call inside StaffDashboard
const oldDestruct = "const { user, logout } = useAuth()";
const newDestruct = "const { user, logout } = useAuth()\n  const location = useLocation()";
if (content.includes(oldDestruct)) {
  content = content.replace(oldDestruct, newDestruct);
} else {
  console.error("useAuth call not found!");
}

// Update the initial tab state
const oldTabState = "const [tab, setTab] = useState('overview')";
const newTabState = "const [tab, setTab] = useState(location.state?.tab || 'overview')\n\n  useEffect(() => {\n    if (location.state?.tab) {\n      setTab(location.state.tab);\n    }\n  }, [location.state]);";
if (content.includes(oldTabState)) {
  content = content.replace(oldTabState, newTabState);
} else {
  console.error("tab state definition not found!");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched StaffDashboard.jsx state!');
