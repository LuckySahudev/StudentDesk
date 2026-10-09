const path = require('path');

const pages = new Set([
  'dashboard', 'profile', 'attendance', 'fees', 'exams', 'results',
  'timetable', 'notices', 'study-material', 'settings',
]);

exports.getPage = (page) => (req, res) => {
  if (!pages.has(page)) return res.sendStatus(404);

  const pagePath = path.resolve(__dirname, '../pages/student', `${page}.html`);
  res.sendFile(pagePath);
};
