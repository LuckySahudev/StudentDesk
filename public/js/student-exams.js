(() => {
  const tableBody = document.querySelector('.exam-table tbody');
  const examFilter = document.querySelector('#exam-filter');
  const viewButton = document.querySelector('#exam-view');
  if (!tableBody || !examFilter || !viewButton) return;

  const date = (value) => new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`));
  const showMessage = (message) => {
    tableBody.replaceChildren();
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = message;
    row.append(cell);
    tableBody.append(row);
  };

  const loadExams = async () => {
    viewButton.disabled = true;
    showMessage('Loading exams...');
    const selected = examFilter.value;
    const query = new URLSearchParams();
    if (selected !== 'all') query.set('exam', selected);
    try {
      const response = await fetch(`/student/api/exams?${query}`, { credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Exams could not be loaded.');

      document.querySelector('#exam-total').textContent = String(data.stats.total);
      document.querySelector('#exam-upcoming').textContent = String(data.stats.upcoming);
      document.querySelector('#exam-completed').textContent = String(data.stats.completed);
      document.querySelector('#exam-next').textContent = data.stats.nextExam ? date(data.stats.nextExam) : 'None';
      document.querySelector('#exam-enrollment').textContent = data.enrollment
        ? `${data.enrollment.className} - ${data.enrollment.academicYear || 'Academic session'}`
        : 'No class enrollment is linked to this student account.';

      const examNames = data.examNames || [];
      examFilter.replaceChildren(new Option('All exams', 'all'));
      examNames.forEach((name) => examFilter.append(new Option(name, name)));
      if (examNames.includes(selected)) examFilter.value = selected;

      if (!data.exams.length) {
        showMessage(data.enrollment ? 'No exams are scheduled for this class and session.' : 'No exam schedule is available.');
        return;
      }
      tableBody.replaceChildren();
      data.exams.forEach((exam) => {
        const row = document.createElement('tr');
        [
          exam.exam_name,
          `${date(exam.start_date)} - ${date(exam.end_date)}`,
          exam.total_marks,
          exam.passing_marks,
          exam.result,
          exam.schedule_status,
        ].forEach((value) => {
          const cell = document.createElement('td');
          cell.textContent = String(value ?? '');
          row.append(cell);
        });
        tableBody.append(row);
      });
    } catch (error) {
      showMessage(error.message || 'Exams could not be loaded.');
      document.querySelector('#exam-enrollment').textContent = 'Exam schedule unavailable';
    } finally {
      viewButton.disabled = false;
    }
  };

  viewButton.addEventListener('click', loadExams);
  examFilter.addEventListener('change', loadExams);
  loadExams();
})();
