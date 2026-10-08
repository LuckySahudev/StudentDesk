const path = require('path');
const fs = require('fs');

const pages = new Set([
  'dashboard', 'profile', 'attendance', 'fees', 'exams', 'results',
  'timetable', 'notices', 'study-material', 'settings',
]);

exports.getpage = (req, res) => {
  const page = req.params.page || 'dashboard';
  if (!pages.has(page)) return res.sendStatus(404);

  const pagePath = path.resolve(__dirname, '../pages/student', `${page}.html`);
  res.type('html').send(fs.readFileSync(pagePath, 'utf8'));
};
