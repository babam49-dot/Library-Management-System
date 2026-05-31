// patch_staff_dashboard.js
// Patches StaffDashboard.jsx to add myborrow tab and handler functions
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/pages/StaffDashboard.jsx');
let text = fs.readFileSync(file, 'utf8');

// ── 1. Insert handler functions + updated TABS right before "const TABS = [" ──
const HANDLERS = `
  // \u2500\u2500 Staff self-borrow handlers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const addToMyCart = (book) => {
    const copyId = String(book.AvailableCopyIds || '').split(',').filter(Boolean)[0]
    if (!copyId) return setMyBorrowMsg({ text: '\u26a0\ufe0f No available copies right now.', ok: false })
    if (myBorrowCart.some(i => i.copyId === Number(copyId)))
      return setMyBorrowMsg({ text: 'Already in your borrow list.', ok: false })
    setMyBorrowCart(prev => [...prev, { bookId: book.BookID, copyId: Number(copyId), title: book.Title, authors: book.Authors }])
    setMyBorrowMsg({ text: '\u2705 "' + book.Title + '" added to borrow list.', ok: true })
    setTimeout(() => setMyBorrowMsg({ text: '', ok: true }), 3000)
  }
  const removeFromMyCart = (copyId) => setMyBorrowCart(prev => prev.filter(i => i.copyId !== copyId))
  const submitMyBorrow = async () => {
    if (!myBorrowCart.length) return setMyBorrowMsg({ text: 'Add at least one book first.', ok: false })
    setMyBorrowLoading(true)
    setMyBorrowMsg({ text: '', ok: true })
    try {
      const res = await axios.post(\`\${API}/borrowing/request\`, { copyIds: myBorrowCart.map(i => i.copyId) }, getHeaders())
      const code = res.data.data?.requestCode || res.data.requestCode || ''
      setMyBorrowMsg({ text: '\u2705 Submitted! Show code "' + code + '" to an Admin at the desk.', ok: true })
      setMyBorrowCart([])
      fetchData()
    } catch (err) {
      setMyBorrowMsg({ text: 'Error: ' + (err.response?.data?.message || err.message), ok: false })
    } finally { setMyBorrowLoading(false) }
  }
  const retractMyBorrow = async (borrowId) => {
    if (!window.confirm('Retract this pending borrow request?')) return
    try {
      await axios.delete(\`\${API}/member/borrows/\${borrowId}/retract\`, getHeaders())
      setMyBorrowMsg({ text: '\u2705 Request retracted. Copy is available again.', ok: true })
      fetchData()
    } catch (err) { setMyBorrowMsg({ text: 'Error: ' + (err.response?.data?.message || err.message), ok: false }) }
  }

  const pendingMyBorrows = myBorrows.filter(b => b.status === 'Pending').length
`;

const OLD_TABS_START = `  const TABS = [`;
if (!text.includes(OLD_TABS_START)) {
  console.error('ERROR: Could not find "const TABS = [" in file!');
  process.exit(1);
}
text = text.replace(OLD_TABS_START, HANDLERS + OLD_TABS_START);
console.log('\u2705 Handlers inserted before TABS');

// ── 2. Add myborrow tab entry right after the overview tab entry ──
// Target the ASCII key name which is safe
const OLD_OVERVIEW = `{ key: 'overview', label: 'Circulation Overview',`;
const NEW_OVERVIEW_AND_MYBORROW =
  `{ key: 'overview', label: 'Circulation Overview',` +
  ` icon: '\ud83d\udcca', path: '/staff' },\n    { key: 'myborrow', label: 'My Borrowing', icon: '\ud83d\udcd6', path: '/staff', badge: pendingMyBorrows },`;

// Replace overview entry (just the part after the icon) to keep emoji intact
// Find the overview line and inject myborrow after it
const overviewLineRegex = /(\{ key: 'overview'[^\n]+\n)/;
const match = text.match(overviewLineRegex);
if (!match) {
  console.error('ERROR: Could not find overview tab entry!');
  process.exit(1);
}
const overviewLine = match[1];
const myborrowLine = `    { key: 'myborrow', label: 'My Borrowing', icon: '\ud83d\udcd6', path: '/staff', badge: pendingMyBorrows },\n`;
text = text.replace(overviewLine, overviewLine + myborrowLine);
console.log('\u2705 myborrow tab added to TABS array');

// ── 3. Write back ──
fs.writeFileSync(file, text, 'utf8');
console.log('\u2705 StaffDashboard.jsx patched successfully!');
