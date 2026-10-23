(() => {
  const rows = document.querySelector('#fee-rows');
  const paymentRows = document.querySelector('#fee-payment-rows');
  const viewButton = document.querySelector('#fee-view');
  if (!rows || !paymentRows || !viewButton) return;

  const money = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(Number(value) || 0);
  const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => value
    ? new Intl.DateTimeFormat('en-IN', options).format(new Date(`${String(value).slice(0, 10)}T00:00:00`))
    : '—';
  const cell = (row, value) => {
    const td = document.createElement('td');
    td.textContent = value ?? '—';
    row.append(td);
  };
  const setMessage = (target, message, colspan) => {
    target.replaceChildren();
    const row = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colspan;
    td.textContent = message;
    row.append(td);
    target.append(row);
  };

  const loadFees = async () => {
    const query = new URLSearchParams();
    const academicYear = document.querySelector('#fee-academic-year').value;
    const feeType = document.querySelector('#fee-type').value;
    if (academicYear) query.set('academicYear', academicYear);
    if (feeType) query.set('feeType', feeType);
    viewButton.disabled = true;
    setMessage(rows, 'Loading fees...', 7);
    setMessage(paymentRows, 'Loading payments...', 7);

    try {
      const response = await fetch(`/student/api/fees?${query}`, { credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fee details could not be loaded.');

      const yearSelect = document.querySelector('#fee-academic-year');
      const selectedYear = yearSelect.value;
      const options = [new Option('All academic years', '')];
      data.academicYears.forEach((year) => options.push(new Option(year, year)));
      yearSelect.replaceChildren(...options);
      if (data.academicYears.includes(selectedYear)) yearSelect.value = selectedYear;

      const typeSelect = document.querySelector('#fee-type');
      const selectedType = typeSelect.value;
      typeSelect.replaceChildren(new Option('All fee types', ''));
      data.feeTypes.forEach((type) => typeSelect.append(new Option(type, type)));
      if (data.feeTypes.includes(selectedType)) typeSelect.value = selectedType;

      document.querySelector('#fee-total').textContent = money(data.summary.total);
      document.querySelector('#fee-paid').textContent = money(data.summary.paid);
      document.querySelector('#fee-pending').textContent = money(data.summary.pending);
      document.querySelector('#fee-payment-count').textContent = String(data.summary.paymentCount);
      document.querySelector('#fee-enrollment').textContent = data.enrollment
        ? `${data.enrollment.className} · Current academic year ${data.enrollment.academicYear}`
        : 'No class enrollment is linked to this student account.';

      rows.replaceChildren();
      if (!data.fees.length) setMessage(rows, 'No fees match these filters.', 7);
      data.fees.forEach((fee) => {
        const row = document.createElement('tr');
        [fee.academic_year, fee.description || fee.fee_type_name, fee.fee_type_name, money(fee.amount), money(fee.amount_paid), money(fee.balance), fee.status]
          .forEach((value) => cell(row, value));
        rows.append(row);
      });

      paymentRows.replaceChildren();
      if (!data.payments.length) setMessage(paymentRows, 'No payments have been recorded for these fees.', 7);
      data.payments.forEach((payment) => {
        const row = document.createElement('tr');
        [payment.payment_id, formatDate(payment.payment_date), payment.description || payment.fee_type_name, payment.fee_type_name,
          payment.payment_method || '—', payment.transaction_id || '—', money(payment.amount_paid)]
          .forEach((value) => cell(row, value));
        paymentRows.append(row);
      });
      document.querySelector('#fee-message').textContent = '';
    } catch (error) {
      setMessage(rows, error.message || 'Fee details could not be loaded.', 7);
      setMessage(paymentRows, 'Payment history could not be loaded.', 7);
      document.querySelector('#fee-message').textContent = error.message || 'Fee details could not be loaded.';
    } finally {
      viewButton.disabled = false;
    }
  };

  viewButton.addEventListener('click', loadFees);
  loadFees();
})();
