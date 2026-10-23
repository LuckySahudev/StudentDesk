(() => {
  const body = document.getElementById('students-body');
  const dialog = document.getElementById('student-dialog');
  const form = document.getElementById('student-form');
  const message = document.getElementById('student-message');
  const search = document.getElementById('student-search');
  const state = { students: [], classes: [], sessions: [] };
  const value = (item) => item == null || item === '' ? '—' : String(item);

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const rows = state.students.filter((student) => [student.admission_no, student.first_name, student.last_name, student.phone, student.email, student.class_name].some((part) => String(part || '').toLowerCase().includes(query)));
    body.replaceChildren();
    if (!rows.length) {
      const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 8; cell.textContent = state.students.length ? 'No students match this search.' : 'No student records yet. Add a student to get started.'; return;
    }
    rows.forEach((student) => {
      const row = body.insertRow();
      [student.admission_no, [student.first_name, student.last_name].filter(Boolean).join(' '), student.gender, student.class_name, student.academic_year, student.phone, student.email].forEach((item) => { row.insertCell().textContent = value(item); });
      const actions = row.insertCell();
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'student-edit'; edit.setAttribute('aria-label', `Edit ${student.first_name}`); edit.innerHTML = '<i class="ti ti-edit"></i> Edit'; edit.addEventListener('click', () => openForm(student)); actions.append(edit);
    });
  }

  async function load() {
    try {
      const response = await fetch('/admin/api/students', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load student records.');
      state.students = data.students; state.classes = data.classes; state.sessions = data.sessions;
      document.getElementById('total-students').textContent = state.students.length;
      document.getElementById('assigned-students').textContent = state.students.filter((student) => student.class_id).length;
      document.getElementById('contact-students').textContent = state.students.filter((student) => student.phone || student.email).length;
      document.getElementById('session-count').textContent = state.sessions.length;
      fillOptions('class_id', state.classes, 'class_id', 'class_name');
      fillOptions('session_id', state.sessions, 'session_id', 'academic_year');
      render();
    } catch (error) { showMessage(error.message, true); body.replaceChildren(); const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 8; cell.textContent = 'Student records could not be loaded.'; }
  }

  function fillOptions(fieldName, options, idField, labelField) {
    const select = form.elements[fieldName];
    const first = select.options[0]; select.replaceChildren(first);
    options.forEach((option) => { const node = document.createElement('option'); node.value = option[idField]; node.textContent = fieldName === 'session_id' && option.active_session ? `${option[labelField]} (Active)` : option[labelField]; select.append(node); });
  }

  function openForm(student) {
    form.reset(); document.getElementById('student-id').value = student?.student_id || '';
    document.getElementById('form-title').textContent = student ? 'Edit student' : 'Add student';
    document.getElementById('save-student').textContent = student ? 'Save Changes' : 'Save Student';
    form.elements.student_id.readOnly = Boolean(student);
    if (student) Object.entries({ student_id: student.student_id, admission_no: student.admission_no, first_name: student.first_name, last_name: student.last_name, gender: student.gender, date_of_birth: student.date_of_birth?.slice(0, 10), admission_date: student.admission_date?.slice(0, 10), phone: student.phone, email: student.email, class_id: student.class_id, roll_no: student.roll_no, session_id: student.session_id, address: student.address }).forEach(([name, fieldValue]) => { if (fieldValue != null) form.elements[name].value = fieldValue; });
    dialog.showModal();
  }

  document.getElementById('add-student').addEventListener('click', () => openForm());
  document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
  document.getElementById('cancel-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  search.addEventListener('input', render);
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); showMessage('');
    const data = Object.fromEntries(new FormData(form).entries());
    const id = document.getElementById('student-id').value;
    try {
      const response = await fetch(id ? `/admin/api/students/${encodeURIComponent(id)}` : '/admin/api/students', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Student could not be saved.');
      dialog.close(); showMessage(result.message); await load();
    } catch (error) { showMessage(error.message, true); }
  });
  load();
})();
