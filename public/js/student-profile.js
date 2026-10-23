(() => {
  const form = document.querySelector('#profile-form');
  if (!form) return;

  const editButton = document.querySelector('#edit-profile');
  const cancelButton = document.querySelector('#cancel-profile-edit');
  const editActions = document.querySelector('#profile-edit-actions');
  const message = document.querySelector('#profile-message');
  let profile = null;

  const formatDate = (value) => value
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
    : 'Not provided';
  const display = (field, value) => {
    const element = form.querySelector(`[data-display="${field}"]`);
    if (element) element.textContent = value || 'Not provided';
  };
  const setEditMode = (enabled) => {
    form.querySelectorAll('[data-display]').forEach((element) => { element.hidden = enabled; });
    form.querySelectorAll('[data-edit]').forEach((element) => { element.hidden = !enabled; });
    editActions.hidden = !enabled;
    editButton.hidden = enabled;
    if (enabled) form.querySelector('[name="email"]').focus();
  };
  const setEditableValues = (contact) => {
    form.elements.first_name.value = contact.first_name || '';
    form.elements.last_name.value = contact.last_name || '';
    form.elements.date_of_birth.value = contact.date_of_birth ? contact.date_of_birth.slice(0, 10) : '';
    form.elements.gender.value = contact.gender || '';
    form.elements.email.value = contact.email || '';
    form.elements.phone.value = contact.phone || '';
    form.elements.address.value = contact.address || '';
  };
  const renderProfile = (data) => {
    const student = data.student;
    document.querySelector('#profile-name').textContent = [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Student';
    document.querySelector('#profile-student-id').textContent = student.student_id;
    document.querySelector('#profile-admission-no').textContent = student.admission_no ?? 'Not provided';
    document.querySelector('#profile-dob').textContent = formatDate(student.date_of_birth);
    document.querySelector('#profile-gender').textContent = student.gender || 'Not provided';
    display('email', student.email);
    display('phone', student.phone);
    display('address', student.address);
    document.querySelector('#profile-class').textContent = data.enrollment?.className || 'Not assigned';
    document.querySelector('#profile-roll-no').textContent = data.enrollment?.rollNo ?? 'Not assigned';
    document.querySelector('#profile-academic-year').textContent = data.enrollment?.academicYear || 'Not assigned';
    document.querySelector('#profile-admission-date').textContent = formatDate(student.admission_date);
    setEditableValues(student);

    const guardianList = document.querySelector('#profile-guardians');
    guardianList.replaceChildren();
    if (!data.guardians.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No guardian information is on file.';
      guardianList.append(empty);
      return;
    }
    data.guardians.forEach((guardian) => {
      const card = document.createElement('div');
      card.className = 'profile-guardian';
      const name = document.createElement('h4');
      name.textContent = [guardian.first_name, guardian.last_name].filter(Boolean).join(' ') || 'Guardian';
      card.append(name);
      [
        ['Relationship', guardian.relationship],
        ['Phone', guardian.phone],
        ['Email', guardian.email],
        ['Occupation', guardian.occupation],
        ['Address', guardian.address],
        ['Primary contact', guardian.is_primary ? 'Yes' : 'No'],
      ].forEach(([label, value]) => {
        if (!value && label !== 'Primary contact') return;
        const row = document.createElement('div');
        row.className = 'detail-row';
        const key = document.createElement('strong');
        const detail = document.createElement('span');
        key.textContent = `${label}:`;
        detail.textContent = value || 'Not provided';
        row.append(key, detail);
        card.append(row);
      });
      guardianList.append(card);
    });
  };

  fetch('/student/api/profile', { credentials: 'same-origin' })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Profile could not be loaded.');
      return result;
    })
    .then((data) => {
      profile = data;
      renderProfile(data);
      editButton.disabled = false;
      message.textContent = '';
    })
    .catch((error) => {
      message.textContent = error.message || 'Profile could not be loaded.';
    });

  editButton.addEventListener('click', () => {
    if (!profile) return;
    message.textContent = '';
    setEditableValues(profile.student);
    setEditMode(true);
  });

  cancelButton.addEventListener('click', () => {
    if (profile) setEditableValues(profile.student);
    setEditMode(false);
    message.textContent = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const saveButton = form.querySelector('[type="submit"]');
    saveButton.disabled = true;
    message.textContent = 'Saving profile...';
    try {
      const response = await fetch('/student/api/profile', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.elements.email.value,
          phone: form.elements.phone.value,
          address: form.elements.address.value,
          first_name: form.elements.first_name.value,
          last_name: form.elements.last_name.value,
          date_of_birth: form.elements.date_of_birth.value,
          gender: form.elements.gender.value,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Profile could not be updated.');
      profile.student = { ...profile.student, ...result.contact };
      renderProfile(profile);
      setEditMode(false);
      message.textContent = 'Profile updated.';
    } catch (error) {
      message.textContent = error.message || 'Profile could not be updated.';
    } finally {
      saveButton.disabled = false;
    }
  });
})();
