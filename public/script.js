// Active nav link
    document.querySelectorAll('.nav-links button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Theme toggle
    const toggle = document.getElementById('themeToggle');
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const icon = toggle.querySelector('i');
      icon.className = document.body.classList.contains('dark')
        ? 'ti ti-moon'
        : 'ti ti-sun';
    });