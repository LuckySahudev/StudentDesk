(() => {
  const tableBody = document.querySelector('.timetable-table tbody');
  const daySelect = document.querySelector('#timetable-day');
  const viewButton = document.querySelector('#timetable-view');
  const enrollmentLabel = document.querySelector('#timetable-enrollment');
  if (!tableBody || !daySelect || !viewButton) return;

  let entries = [];
  const setMessage = (message) => {
    tableBody.replaceChildren();
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.textContent = message;
    row.append(cell);
    tableBody.append(row);
  };

  const render = () => {
    const selectedDay = daySelect.value.toLowerCase();
    const filtered = selectedDay === 'all'
      ? entries
      : entries.filter((entry) => entry.day.toLowerCase() === selectedDay);
    tableBody.replaceChildren();
    if (!filtered.length) {
      setMessage(entries.length ? 'No periods are scheduled for this day.' : 'No timetable has been published for your class and academic session yet.');
      return;
    }
    filtered.forEach((entry) => {
      const row = document.createElement('tr');
      [entry.day, entry.period_number, entry.subject_name, entry.teachers].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value ?? '';
        row.append(cell);
      });
      tableBody.append(row);
    });
  };

  const load = async () => {
    viewButton.disabled = true;
    setMessage('Loading timetable...');
    try {
      const response = await fetch('/student/api/timetable', { credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Timetable could not be loaded.');
      entries = result.entries || [];
      enrollmentLabel.textContent = result.enrollment
        ? `${result.enrollment.className} - ${result.enrollment.academicYear || 'Academic session'}`
        : 'No class enrollment is linked to this student account.';
      const selected = daySelect.value;
      const availableDays = [...new Set(entries.map((entry) => entry.day))];
      daySelect.replaceChildren(new Option('All days', 'all'));
      availableDays.forEach((day) => daySelect.append(new Option(day, day)));
      if (availableDays.some((day) => day.toLowerCase() === selected.toLowerCase())) daySelect.value = selected;
      render();
    } catch (error) {
      enrollmentLabel.textContent = 'Timetable unavailable';
      setMessage(error.message || 'Timetable could not be loaded.');
    } finally {
      viewButton.disabled = false;
    }
  };

  viewButton.addEventListener('click', render);
  daySelect.addEventListener('change', render);
  load();
})();
