const path = require('path');
const pool = require('../database');

const pages = new Set([
  'dashboard', 'profile', 'attendance', 'fees', 'exams', 'results',
  'timetable', 'notices',
]);

async function getStudentEnrollment(studentId) {
  const result = await pool.query(
    `SELECT sc.roll_no, sc.class_id, sc.session_id, a.academic_year, c.class_name
     FROM public.class_students sc
     JOIN public.classes c ON c.class_id = sc.class_id
     LEFT JOIN public.academic_sessions a ON a.session_id = sc.session_id
     WHERE sc.student_id = $1
     ORDER BY a.active_session DESC NULLS LAST, a.start_date DESC NULLS LAST, sc.session_id DESC NULLS LAST
     LIMIT 1`,
    [studentId],
  );
  return result.rows[0] || null;
}

async function getStudentNotices(classId, limit = 100) {
  const result = await pool.query(
    `SELECT n.notice_id, n.title, n.notice, n.publish_date AS notice_date, n.expiry_date,
            c.class_name,
            CONCAT_WS(' ', e.first_name, e.last_name) AS posted_by
     FROM public.notices n
     LEFT JOIN public.classes c ON c.class_id = n.class_id
     LEFT JOIN public.employees e ON e.employee_id = n.employee_id
     WHERE (n.class_id IS NULL OR n.class_id = $1)
       AND (n.expiry_date IS NULL OR n.expiry_date >= CURRENT_DATE)
     ORDER BY n.publish_date DESC, n.notice_id DESC
     LIMIT $2`,
    [classId, limit],
  );
  return result.rows;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

exports.getPage = (page) => (req, res) => {
  if (!pages.has(page)) return res.sendStatus(404);

  const pagePath = path.resolve(__dirname, '../pages/student', `${page}.html`);
  res.sendFile(pagePath);
};

exports.getDashboardData = async (req, res) => {
  const studentId = req.user.id;

  try {
    const studentResult = await pool.query(
      `SELECT student_id, first_name, last_name
       FROM public.students
       WHERE student_id = $1
       LIMIT 1`,
      [studentId],
    );
    const student = studentResult.rows[0];
    if (!student) return res.status(404).json({ error: 'Student account was not found.' });

    const enrollment = await getStudentEnrollment(studentId);
    let attendance = { present: 0, absent: 0, total: 0, percentage: null };
    let fees = { total: 0, paid: 0, outstanding: 0, nextDueDate: null };
    let subjects = [];

    if (enrollment) {
      const [attendanceResult, feesResult, subjectsResult] = await Promise.all([
        pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE a.student_id IS NOT NULL)::int AS present,
             COUNT(*) FILTER (WHERE a.student_id IS NULL)::int AS absent,
             COUNT(*)::int AS total
           FROM public.attendance_sessions sess
           LEFT JOIN public.attendance a
             ON a.class_id = sess.class_id
            AND a.student_id = $1
            AND a.session_id = sess.session_id
            AND a.attendance_date = sess.attendance_date
           WHERE sess.class_id = $2 AND sess.session_id = $3`,
          [studentId, enrollment.class_id, enrollment.session_id],
        ),
        pool.query(
          `WITH payments AS (
             SELECT fee_structure_id, session_id, SUM(amount_paid)::numeric AS amount_paid
             FROM public.fee_payments
             WHERE student_id = $1 AND session_id = $2
             GROUP BY fee_structure_id, session_id
           )
           SELECT COALESCE(SUM(fs.amount), 0)::numeric AS total,
                  COALESCE(SUM(LEAST(COALESCE(p.amount_paid, 0), fs.amount)), 0)::numeric AS paid,
                  COALESCE(SUM(GREATEST(fs.amount - COALESCE(p.amount_paid, 0), 0)), 0)::numeric AS outstanding
           FROM public.fee_structures fs
           LEFT JOIN payments p ON p.fee_structure_id = fs.fee_structure_id AND p.session_id = fs.session_id
           WHERE fs.class_id = $3 AND fs.session_id = $2`,
          [studentId, enrollment.session_id, enrollment.class_id],
        ),
        pool.query(
          `SELECT s.subject_name,
                  COALESCE(
                    STRING_AGG(DISTINCT CONCAT_WS(' ', e.first_name, e.last_name), ', ')
                      FILTER (WHERE t.teacher_id IS NOT NULL),
                    'Teacher not assigned'
                  ) AS teachers
           FROM public.class_subjects cs
           JOIN public.subjects s ON s.subject_id = cs.subject_id
           LEFT JOIN public.class_subject_teachers cst
             ON cst.class_id = cs.class_id AND cst.subject_id = cs.subject_id
            AND (cst.session_id = $2 OR cst.session_id IS NULL)
           LEFT JOIN public.teachers t ON t.teacher_id = cst.teacher_id
           LEFT JOIN public.employees e ON e.employee_id = t.employee_id
           WHERE cs.class_id = $1
           GROUP BY s.subject_id, s.subject_name
           ORDER BY s.subject_name`,
          [enrollment.class_id, enrollment.session_id],
        ),
      ]);

      const present = attendanceResult.rows[0].present;
      const total = attendanceResult.rows[0].total;
      attendance = {
        present,
        absent: attendanceResult.rows[0].absent,
        total,
        percentage: total ? Math.round((present / total) * 100) : null,
      };
      const feeRow = feesResult.rows[0];
      const feeTotal = Number(feeRow.total);
      const feePaid = Number(feeRow.paid);
      fees = {
        total: feeTotal,
        paid: feePaid,
        outstanding: Number(feeRow.outstanding),
        nextDueDate: null,
      };
      subjects = subjectsResult.rows;
    }

    const notices = await getStudentNotices(enrollment?.class_id ?? null, 5);
    res.json({
      student: {
        id: student.student_id,
        name: [student.first_name, student.last_name].filter(Boolean).join(' ') || `Student ${student.student_id}`,
      },
      class: enrollment ? { name: enrollment.class_name, academicYear: enrollment.academic_year } : null,
      attendance,
      fees,
      subjects,
      notices,
    });
  } catch (error) {
    console.error('Unable to load student dashboard:', error.message);
    res.status(503).json({ error: 'Student dashboard data is temporarily unavailable.' });
  }
};

exports.getFees = async (req, res) => {
  const academicYear = typeof req.query.academicYear === 'string' ? req.query.academicYear.trim() : '';
  const feeType = typeof req.query.feeType === 'string' ? req.query.feeType.trim() : '';
  if (academicYear.length > 30 || feeType.length > 100) {
    return res.status(400).json({ error: 'Choose a valid academic year and fee type.' });
  }

  try {
    const enrollment = await getStudentEnrollment(req.user.id);
    const [yearsResult, feeTypesResult, feesResult, paymentsResult] = await Promise.all([
      pool.query(
        `SELECT DISTINCT a.academic_year
         FROM public.class_students sc
         JOIN public.academic_sessions a ON a.session_id = sc.session_id
         WHERE sc.student_id = $1
         ORDER BY a.academic_year DESC`,
        [req.user.id],
      ),
      pool.query(
        `SELECT DISTINCT ft.fee_type_name
         FROM public.fee_structures fs
         JOIN public.class_students sc ON sc.class_id = fs.class_id AND sc.session_id = fs.session_id
         JOIN public.fee_types ft ON ft.fee_type_id = fs.fee_type_id
         WHERE sc.student_id = $1
         ORDER BY ft.fee_type_name`,
        [req.user.id],
      ),
      pool.query(
        `WITH enrolled AS (
           SELECT DISTINCT class_id, session_id
           FROM public.class_students WHERE student_id = $1
         ), payments AS (
           SELECT fee_structure_id, session_id, SUM(amount_paid)::numeric AS amount_paid
           FROM public.fee_payments WHERE student_id = $1
           GROUP BY fee_structure_id, session_id
         )
         SELECT fs.fee_structure_id, a.academic_year, ft.fee_type_name,
                fs.description, fs.amount::numeric AS amount,
                COALESCE(p.amount_paid, 0)::numeric AS amount_paid,
                GREATEST(fs.amount - COALESCE(p.amount_paid, 0), 0)::numeric AS balance
         FROM enrolled sc
         JOIN public.fee_structures fs ON fs.class_id = sc.class_id AND fs.session_id = sc.session_id
         JOIN public.academic_sessions a ON a.session_id = fs.session_id
         JOIN public.fee_types ft ON ft.fee_type_id = fs.fee_type_id
         LEFT JOIN payments p ON p.fee_structure_id = fs.fee_structure_id AND p.session_id = fs.session_id
         WHERE ($2::text = '' OR a.academic_year = $2)
           AND ($3::text = '' OR ft.fee_type_name = $3)
         ORDER BY a.academic_year DESC, ft.fee_type_name, fs.fee_structure_id`,
        [req.user.id, academicYear, feeType],
      ),
      pool.query(
        `SELECT fp.payment_id, fp.fee_structure_id, a.academic_year,
                ft.fee_type_name, fs.description, fp.amount_paid::numeric AS amount_paid,
                fp.payment_date, fp.payment_method, fp.payment_status,
                fp.transaction_id, fp.amount_remains::numeric AS amount_remains
         FROM public.fee_payments fp
         JOIN public.fee_structures fs ON fs.fee_structure_id = fp.fee_structure_id
         JOIN public.fee_types ft ON ft.fee_type_id = fs.fee_type_id
         JOIN public.academic_sessions a ON a.session_id = fp.session_id
         WHERE fp.student_id = $1
           AND ($2::text = '' OR a.academic_year = $2)
           AND ($3::text = '' OR ft.fee_type_name = $3)
         ORDER BY fp.payment_date DESC, fp.payment_id DESC`,
        [req.user.id, academicYear, feeType],
      ),
    ]);

    const fees = feesResult.rows.map((fee) => ({
      ...fee,
      amount: Number(fee.amount),
      amount_paid: Number(fee.amount_paid),
      balance: Number(fee.balance),
      status: Number(fee.balance) <= 0 ? 'Paid' : Number(fee.amount_paid) > 0 ? 'Partially paid' : 'Pending',
    }));
    const total = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paid = fees.reduce((sum, fee) => sum + fee.amount_paid, 0);
    const pending = fees.reduce((sum, fee) => sum + fee.balance, 0);
    res.json({
      enrollment: enrollment ? { className: enrollment.class_name, academicYear: enrollment.academic_year } : null,
      academicYears: yearsResult.rows.map((row) => row.academic_year),
      feeTypes: feeTypesResult.rows.map((row) => row.fee_type_name),
      summary: { total, paid, pending, paymentCount: paymentsResult.rowCount },
      fees,
      payments: paymentsResult.rows.map((payment) => ({ ...payment, amount_paid: Number(payment.amount_paid), amount_remains: Number(payment.amount_remains) })),
    });
  } catch (error) {
    console.error('Unable to load student fees:', error.message);
    res.status(503).json({ error: 'Student fee details are temporarily unavailable.' });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const enrollment = await getStudentEnrollment(req.user.id);
    const notices = await getStudentNotices(enrollment?.class_id ?? null);
    res.json({ notices });
  } catch (error) {
    console.error('Unable to load student notices:', error.message);
    res.status(503).json({ error: 'Student notices are temporarily unavailable.' });
  }
};

exports.getTimetable = async (req, res) => {
  try {
    const enrollment = await getStudentEnrollment(req.user.id);
    if (!enrollment?.session_id) return res.json({ enrollment: null, days: [], entries: [] });

    const result = await pool.query(
      `SELECT tt.day, p.period_number, s.subject_name,
              COALESCE(
                STRING_AGG(DISTINCT NULLIF(CONCAT_WS(' ', e.first_name, e.last_name), ''), ', ')
                  FILTER (WHERE t.teacher_id IS NOT NULL),
                'Teacher not assigned'
              ) AS teachers
       FROM public.timetable tt
       JOIN public.periods p ON p.period_id = tt.period_id
       JOIN public.subjects s ON s.subject_id = tt.subject_id
       LEFT JOIN public.class_subject_teachers cst
         ON cst.class_id = tt.class_id AND cst.subject_id = tt.subject_id
        AND (cst.session_id = tt.session_id OR cst.session_id IS NULL)
       LEFT JOIN public.teachers t ON t.teacher_id = cst.teacher_id
       LEFT JOIN public.employees e ON e.employee_id = t.employee_id
       WHERE tt.class_id = $1 AND tt.session_id = $2
       GROUP BY tt.day, p.period_number, s.subject_name
       ORDER BY CASE LOWER(tt.day)
         WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3
         WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5 WHEN 'saturday' THEN 6
         WHEN 'sunday' THEN 7 ELSE 8 END,
         p.period_number, s.subject_name`,
      [enrollment.class_id, enrollment.session_id],
    );
    res.json({
      enrollment: { className: enrollment.class_name, academicYear: enrollment.academic_year },
      days: [...new Set(result.rows.map((entry) => entry.day))],
      entries: result.rows,
    });
  } catch (error) {
    console.error('Unable to load student timetable:', error.message);
    res.status(503).json({ error: 'Student timetable is temporarily unavailable.' });
  }
};

exports.getExams = async (req, res) => {
  const examName = typeof req.query.exam === 'string' ? req.query.exam.trim() : '';
  if (examName.length > 100) return res.status(400).json({ error: 'Choose a valid exam.' });

  try {
    const enrollment = await getStudentEnrollment(req.user.id);
    if (!enrollment?.session_id) {
      return res.json({ enrollment: null, stats: { total: 0, upcoming: 0, completed: 0, nextExam: null }, exams: [] });
    }

    const result = await pool.query(
      `SELECT e.exam_id, e.exam_name, e.start_date, e.end_date,
              e.total_marks, e.passing_marks, se.is_passed,
              CASE
                WHEN e.end_date < CURRENT_DATE THEN 'Completed'
                WHEN e.start_date > CURRENT_DATE THEN 'Upcoming'
                ELSE 'In progress'
              END AS schedule_status
       FROM public.exams e
       LEFT JOIN public.student_exam se
         ON se.exam_id = e.exam_id AND se.student_id = $1
        AND se.class_id = e.class_id AND se.session_id = e.session_id
       WHERE e.class_id = $2 AND e.session_id = $3
       ORDER BY e.start_date, e.exam_name`,
      [req.user.id, enrollment.class_id, enrollment.session_id],
    );
    const allExams = result.rows.map((exam) => ({
      ...exam,
      result: exam.is_passed === null ? 'Not recorded' : exam.is_passed ? 'Passed' : 'Not passed',
    }));
    const exams = examName ? allExams.filter((exam) => exam.exam_name === examName) : allExams;
    const upcoming = allExams.filter((exam) => exam.schedule_status === 'Upcoming').length;
    const completed = allExams.filter((exam) => exam.schedule_status === 'Completed').length;
    const nextExam = allExams.find((exam) => exam.schedule_status === 'Upcoming')?.start_date || null;

    res.json({
      enrollment: { className: enrollment.class_name, academicYear: enrollment.academic_year },
      stats: { total: allExams.length, upcoming, completed, nextExam },
      exams,
      examNames: [...new Set(allExams.map((exam) => exam.exam_name).filter(Boolean))],
    });
  } catch (error) {
    console.error('Unable to load student exams:', error.message);
    res.status(503).json({ error: 'Student exams are temporarily unavailable.' });
  }
};

exports.getAttendance = async (req, res) => {
  const from = req.query.from || null;
  const to = req.query.to || null;
  const status = String(req.query.status || 'all').toLowerCase();
  if ((from && !isValidDate(from)) || (to && !isValidDate(to)) || !['all', 'present', 'absent'].includes(status)) {
    return res.status(400).json({ error: 'Choose valid dates and an attendance status.' });
  }
  if (from && to && from > to) {
    return res.status(400).json({ error: 'The start date must be on or before the end date.' });
  }

  try {
    const [statsResult, recordsResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE a.student_id IS NOT NULL)::int AS present,
           COUNT(*) FILTER (WHERE a.student_id IS NULL)::int AS absent,
           COUNT(*)::int AS total
         FROM public.attendance_sessions sess
         LEFT JOIN public.attendance a
           ON a.class_id = sess.class_id
          AND a.student_id = $1
          AND a.session_id = sess.session_id
          AND a.attendance_date = sess.attendance_date
         WHERE EXISTS (
           SELECT 1 FROM public.class_students sc
           WHERE sc.student_id = $1 AND sc.class_id = sess.class_id
             AND sc.session_id = sess.session_id
         )`,
        [req.user.id],
      ),
      pool.query(
        `SELECT sess.attendance_date,
                c.class_name,
                ac.academic_year,
                sc.roll_no,
                COALESCE(NULLIF(CONCAT_WS(' ', e.first_name, e.last_name), ''), 'Teacher not listed') AS teacher_name,
                CASE WHEN a.student_id IS NULL THEN 'Absent' ELSE 'Present' END AS status
         FROM public.attendance_sessions sess
         JOIN public.class_students sc
           ON sc.student_id = $1
          AND sc.class_id = sess.class_id
          AND sc.session_id = sess.session_id
         JOIN public.classes c ON c.class_id = sess.class_id
         LEFT JOIN public.academic_sessions ac ON ac.session_id = sess.session_id
         LEFT JOIN public.attendance a
           ON a.class_id = sess.class_id
          AND a.student_id = sc.student_id
          AND a.session_id = sess.session_id
          AND a.attendance_date = sess.attendance_date
         LEFT JOIN public.teachers t ON t.teacher_id = sess.teacher_id
         LEFT JOIN public.employees e ON e.employee_id = t.employee_id
         WHERE ($2::date IS NULL OR sess.attendance_date >= $2::date)
           AND ($3::date IS NULL OR sess.attendance_date <= $3::date)
           AND ($4 = 'all' OR ($4 = 'present' AND a.student_id IS NOT NULL) OR ($4 = 'absent' AND a.student_id IS NULL))
         ORDER BY sess.attendance_date DESC, c.class_name`,
        [req.user.id, from, to, status],
      ),
    ]);

    const stats = statsResult.rows[0];
    res.json({
      stats: {
        present: stats.present,
        absent: stats.absent,
        total: stats.total,
        percentage: stats.total ? Math.round((stats.present / stats.total) * 100) : null,
      },
      records: recordsResult.rows,
    });
  } catch (error) {
    console.error('Unable to load student attendance:', error.message);
    res.status(503).json({ error: 'Student attendance is temporarily unavailable.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT student_id, admission_no, first_name, last_name, gender,
              date_of_birth, phone, email, address, admission_date
       FROM public.students
       WHERE student_id = $1
       LIMIT 1`,
      [req.user.id],
    );
    const student = result.rows[0];
    if (!student) return res.status(404).json({ error: 'Student account was not found.' });

    const [enrollment, guardians] = await Promise.all([
      getStudentEnrollment(req.user.id),
      pool.query(
        `SELECT g.first_name, g.last_name, g.relationship, g.phone, g.email,
                g.occupation, g.address, sg.is_primary
         FROM public.student_guardians sg
         JOIN public.guardians g ON g.guardian_id = sg.guardian_id
         WHERE sg.student_id = $1
         ORDER BY sg.is_primary DESC, g.first_name, g.last_name`,
        [req.user.id],
      ),
    ]);

    res.json({
      student,
      enrollment: enrollment ? {
        rollNo: enrollment.roll_no,
        className: enrollment.class_name,
        academicYear: enrollment.academic_year,
      } : null,
      guardians: guardians.rows,
    });
  } catch (error) {
    console.error('Unable to load student profile:', error.message);
    res.status(503).json({ error: 'Student profile is temporarily unavailable.' });
  }
};

exports.updateProfile = async (req, res) => {
  const body = req.body || {};
  const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : '';
  const lastName = typeof body.last_name === 'string' ? body.last_name.trim() : '';
  const gender = typeof body.gender === 'string' ? body.gender.trim() : '';
  const dateOfBirth = body.date_of_birth || null;
  const { email, phone, address } = body;
  const validDate = (value) => {
    if (!value) return true;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  if (
    !firstName || firstName.length > 100 || lastName.length > 100 ||
    (gender && !['Female', 'Male', 'Other'].includes(gender)) || !validDate(dateOfBirth) ||
    typeof email !== 'string' || email.trim().length > 254 || (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) ||
    typeof phone !== 'string' || phone.trim().length > 30 || (phone.trim() && !/^[+\d().\-\s]+$/.test(phone.trim())) ||
    (address !== null && address !== undefined && (typeof address !== 'string' || address.length > 2000))
  ) {
    return res.status(400).json({ error: 'Enter a valid email, phone number, and address.' });
  }

  try {
    const result = await pool.query(
      `UPDATE public.students
       SET first_name = $1, last_name = $2, gender = $3, date_of_birth = $4,
           email = $5, phone = $6, address = $7
       WHERE student_id = $8
       RETURNING first_name, last_name, gender, date_of_birth, email, phone, address`,
      [firstName, lastName || null, gender || null, dateOfBirth || null, email.trim() || null, phone.trim() || null, address?.trim() || null, req.user.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Student account was not found.' });
    res.json({ contact: result.rows[0], message: 'Profile updated.' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'That email or phone number is already in use.' });
    console.error('Unable to update student profile:', error.message);
    res.status(503).json({ error: 'Profile could not be updated right now.' });
  }
};
