(() => {
  const themeKey = 'studentdesk-theme';
  const toggle = document.querySelector('.theme-toggle');
  const savedTheme = localStorage.getItem(themeKey);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function setTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);

    if (!toggle) return;
    const icon = toggle.querySelector('i');
    icon?.classList.toggle('ti-sun', !isDark);
    icon?.classList.toggle('ti-moon', isDark);
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('aria-pressed', String(isDark));
  }

  setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  toggle?.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem(themeKey, nextTheme);
    setTheme(nextTheme);
  });
})();
