const path = require('path');

const pages = new Set([
  'dashboard', 'profile', 'my-classes', 'students', 'attendance', 'exams',
  'results', 'study-material', 'timetable', 'notices', 'settings',
]);

exports.getPage = (page) => (req, res) => {
  if (!pages.has(page)) return res.sendStatus(404);

  const pagePath = path.resolve(__dirname, '../pages/teacher', `${page}.html`);
  res.sendFile(pagePath);
};
