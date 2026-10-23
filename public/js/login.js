(() => {
  const form = document.querySelector('#login-form');
  if (!form) return;

  const role = form.elements.role;
  const userId = form.elements.userId;
  const idLabel = document.querySelector('#user-id-label');
  const errorMessage = document.querySelector('#login-error');
  const submitButton = form.querySelector('[type="submit"]');
  const requestedPath = new URLSearchParams(window.location.search).get('next') || '';
  const roleLabels = {
    student: ['Student ID', 'Enter your student ID'],
    teacher: ['Teacher ID', 'Enter your teacher ID'],
    admin: ['Admin ID', 'Enter your admin ID'],
  };

  role.addEventListener('change', () => {
    const [label, placeholder] = roleLabels[role.value] || roleLabels.student;
    idLabel.textContent = label;
    userId.placeholder = placeholder;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = 'Signing in…';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          role: role.value,
          userId: userId.value,
          password: form.elements.password.value,
          remember: form.elements.remember.checked,
          returnTo: requestedPath,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      window.location.assign(result.redirect);
    } catch (error) {
      errorMessage.textContent = error.message || 'Unable to sign in. Please try again.';
      submitButton.disabled = false;
      submitButton.textContent = 'Login';
    }
  });
})();
