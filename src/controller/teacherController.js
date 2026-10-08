const path = require('path');
const fs = require('fs');

const pages = new Set([
  'dashboard', 'profile', 'my-classes', 'students', 'attendance', 'exams',
  'results', 'study-material', 'timetable', 'notices', 'settings',
]);

exports.getpage = (req, res) => {
  const page = req.params.page || 'dashboard';
  if (!pages.has(page)) return res.sendStatus(404);

  const pagePath = path.resolve(__dirname, '../pages/teacher', `${page}.html`);
  res.type('html').send(fs.readFileSync(pagePath, 'utf8'));
};
