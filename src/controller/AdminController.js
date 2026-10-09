const path = require('path');

const pages = new Set([
  'dashboard', 'students', 'teachers', 'attendance', 'classes', 'fees',
  'exams', 'results', 'notices', 'timetable', 'analytics', 'settings',
]);

exports.getPage = (page) => (req, res) => {
  if (!pages.has(page)) return res.sendStatus(404);

  const pagePath = path.resolve(__dirname, '../pages/admin', `${page}.html`);
  res.sendFile(pagePath);
};
