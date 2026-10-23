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

  const studentName = document.querySelector('#student-name');
  if (!studentName) return;

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };
  const money = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
  const date = (value) => new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(value));

  const renderNotices = (notices) => {
    const noticeList = document.querySelector('#student-notices');
    if (!noticeList) return;
    noticeList.replaceChildren();
    if (!notices.length) {
      const empty = document.createElement('p');
      empty.textContent = 'There are no current notices for you.';
      noticeList.append(empty);
      return;
    }
    notices.forEach((notice) => {
      const item = document.createElement('article');
      const heading = document.createElement('p');
      const message = document.createElement('p');
      heading.textContent = `${date(notice.notice_date)} · ${notice.title}`;
      message.textContent = notice.notice;
      item.append(heading, message);
      noticeList.append(item);
    });
  };

  fetch('/student/api/dashboard', { credentials: 'same-origin' })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Dashboard data could not be loaded.');
      return result;
    })
    .then((data) => {
      studentName.textContent = data.student.name;
      setText('#class-value', data.class ? `${data.class.name} · ${data.class.academicYear}` : 'Not assigned');
      setText('#attendance-value', data.attendance.percentage === null ? 'No records' : `${data.attendance.percentage}%`);
      setText('#fee-status-value', data.fees.total <= 0 ? 'No fees' : data.fees.outstanding <= 0 ? 'Paid' : 'Due');
      setText('#subject-count-value', String(data.subjects.length));
      setText('#fee-summary-value', `Paid ${money(data.fees.paid)} of ${money(data.fees.total)} · Outstanding ${money(data.fees.outstanding)}`);
      setText('#fee-due-value', data.fees.nextDueDate ? `Next due: ${date(data.fees.nextDueDate)}` : 'No due date available');

      const subjectList = document.querySelector('#student-subjects');
      if (!subjectList) return;
      subjectList.replaceChildren();
      if (!data.subjects.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No subjects are assigned to your class yet.';
        subjectList.append(empty);
        return;
      }
      data.subjects.forEach((subject) => {
        const row = document.createElement('p');
        row.textContent = `${subject.subject_name} · ${subject.teachers}`;
        subjectList.append(row);
      });
      renderNotices(data.notices);
    })
    .catch((error) => {
      studentName.textContent = 'Student';
      setText('#fee-summary-value', error.message || 'Dashboard data could not be loaded.');
      setText('#student-subjects', 'Dashboard data could not be loaded.');
      setText('#student-notices', 'Notices could not be loaded.');
    });
})();
