(() => {
  const tableBody = document.querySelector('.notice-table tbody');
  const search = document.querySelector('#notice-search');
  const audience = document.querySelector('#notice-audience');
  if (!tableBody || !search || !audience) return;

  let notices = [];
  const formatDate = (value) => value
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`))
    : 'No expiry';
  const setRowMessage = (text) => {
    tableBody.replaceChildren();
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = text;
    row.append(cell);
    tableBody.append(row);
  };

  const render = () => {
    const term = search.value.trim().toLowerCase();
    const scope = audience.value;
    const filtered = notices.filter((notice) => {
      const classNotice = Boolean(notice.class_name);
      const matchesAudience = scope === 'all' || (scope === 'class' && classNotice) || (scope === 'school' && !classNotice);
      const searchable = [notice.title, notice.notice, notice.class_name, notice.posted_by].join(' ').toLowerCase();
      return matchesAudience && searchable.includes(term);
    });
    tableBody.replaceChildren();
    if (!filtered.length) return setRowMessage(notices.length ? 'No notices match these filters.' : 'There are no current or upcoming notices for you.');

    filtered.forEach((notice) => {
      const row = document.createElement('tr');
      [
        formatDate(notice.notice_date),
        notice.title,
        notice.notice,
        notice.class_name || 'All students',
        notice.posted_by || 'School staff',
        formatDate(notice.expiry_date),
      ].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value || '';
        row.append(cell);
      });
      tableBody.append(row);
    });
  };

  search.addEventListener('input', render);
  audience.addEventListener('change', render);
  setRowMessage('Loading notices...');

  fetch('/student/api/notices', { credentials: 'same-origin' })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Notices could not be loaded.');
      return result.notices;
    })
    .then((result) => {
      notices = Array.isArray(result) ? result : [];
      document.querySelector('#notice-total').textContent = String(notices.length);
      document.querySelector('#notice-class-total').textContent = String(notices.filter((notice) => notice.class_name).length);
      document.querySelector('#notice-school-total').textContent = String(notices.filter((notice) => !notice.class_name).length);
      document.querySelector('#notice-latest-date').textContent = notices.length ? formatDate(notices[0].notice_date) : '—';
      render();
    })
    .catch((error) => setRowMessage(error.message || 'Notices could not be loaded.'));
})();
