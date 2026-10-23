(() => {
  const tableBody = document.querySelector('.attendance-table tbody');
  const viewButton = document.querySelector('#attendance-view');
  if (!tableBody || !viewButton) return;

  const formatDate = (value) => new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(value));

  const loadAttendance = async () => {
    const query = new URLSearchParams({ status: document.querySelector('#attendance-status').value });
    const from = document.querySelector('#attendance-from').value;
    const to = document.querySelector('#attendance-to').value;
    if (from) query.set('from', from);
    if (to) query.set('to', to);

    viewButton.disabled = true;
    tableBody.replaceChildren();
    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');
    loadingCell.colSpan = 6;
    loadingCell.textContent = 'Loading attendance...';
    loadingRow.append(loadingCell);
    tableBody.append(loadingRow);

    try {
      const response = await fetch(`/student/api/attendance?${query}`, { credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Attendance could not be loaded.');

      document.querySelector('#attendance-percentage').textContent = result.stats.percentage === null
        ? 'No records'
        : `${result.stats.percentage}%`;
      document.querySelector('#attendance-present').textContent = String(result.stats.present);
      document.querySelector('#attendance-absent').textContent = String(result.stats.absent);
      document.querySelector('#attendance-total').textContent = String(result.stats.total);
      tableBody.replaceChildren();

      if (!result.records.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'No attendance sessions match these filters.';
        row.append(cell);
        tableBody.append(row);
        return;
      }

      result.records.forEach((record) => {
        const row = document.createElement('tr');
        [
          formatDate(record.attendance_date),
          record.class_name,
          record.academic_year,
          record.roll_no,
          record.teacher_name,
          record.status,
        ].forEach((value) => {
          const cell = document.createElement('td');
          cell.textContent = value;
          row.append(cell);
        });
        tableBody.append(row);
      });
    } catch (error) {
      tableBody.replaceChildren();
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.textContent = error.message || 'Attendance could not be loaded.';
      row.append(cell);
      tableBody.append(row);
    } finally {
      viewButton.disabled = false;
    }
  };

  viewButton.addEventListener('click', loadAttendance);
  loadAttendance();
})();
