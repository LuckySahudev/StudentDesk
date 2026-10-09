(() => {
  const dateLabel = document.querySelector('.dashboard .date');
  if (dateLabel) {
    const today = new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    dateLabel.textContent = `Today is ${today}`;
  }

  document.querySelectorAll('.dashboard .head').forEach((header, index) => {
    const panel = header.parentElement;
    if (!panel) return;

    const content = panel.querySelector('.content, .recent-adimtion');
    if (!content) return;
    if (!content.id) content.id = `dashboard-panel-content-${index + 1}`;

    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'true');
    header.setAttribute('aria-controls', content.id);
    header.setAttribute('aria-label', `Collapse ${header.querySelector('h4')?.textContent.trim() || 'dashboard panel'}`);
    content.setAttribute('aria-hidden', 'false');

    const icon = header.querySelector('.ti-chevron-up, .ti-chevron-down');
    icon?.setAttribute('aria-hidden', 'true');

    const togglePanel = () => {
      const collapsed = panel.classList.toggle('is-collapsed');
      header.setAttribute('aria-expanded', String(!collapsed));
      header.setAttribute('aria-label', `${collapsed ? 'Expand' : 'Collapse'} ${header.querySelector('h4')?.textContent.trim() || 'dashboard panel'}`);
      content.setAttribute('aria-hidden', String(collapsed));
    };

    header.addEventListener('click', togglePanel);
    header.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      togglePanel();
    });
  });
})();
