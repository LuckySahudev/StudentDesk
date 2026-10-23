const path = require('path');
const pool = require('../database');

const pages = new Set([
  'dashboard', 'students', 'teachers', 'attendance', 'classes', 'fees',
  'exams', 'results', 'notices', 'timetable', 'analytics', 'settings',
]);

exports.getPage = (page) => (req, res) => {
  if (!pages.has(page)) return res.sendStatus(404);

  const pagePath = path.resolve(__dirname, '../pages/admin', `${page}.html`);
  res.sendFile(pagePath);
};

exports.getStudents = async (req, res) => {
  try {
    const [students, classes, sessions] = await Promise.all([
      pool.query(`SELECT s.student_id, s.admission_no, s.first_name, s.last_name,
                         s.gender, s.date_of_birth, s.phone, s.email, s.address,
                         s.admission_date, cs.class_id, cs.roll_no, cs.session_id,
                         c.class_name, a.academic_year
                  FROM public.students s
                  LEFT JOIN LATERAL (
                    SELECT class_id, roll_no, session_id FROM public.class_students
                    WHERE student_id = s.student_id
                    ORDER BY session_id DESC NULLS LAST LIMIT 1
                  ) cs ON true
                  LEFT JOIN public.classes c ON c.class_id = cs.class_id
                  LEFT JOIN public.academic_sessions a ON a.session_id = cs.session_id
                  ORDER BY s.student_id DESC`),
      pool.query('SELECT class_id, class_name FROM public.classes ORDER BY class_name'),
      pool.query('SELECT session_id, academic_year, active_session FROM public.academic_sessions ORDER BY active_session DESC, start_date DESC'),
    ]);
    res.json({ students: students.rows, classes: classes.rows, sessions: sessions.rows });
  } catch (error) {
    console.error('Unable to load admin students:', error.message);
    res.status(503).json({ error: 'Student records are temporarily unavailable.' });
  }
};

exports.saveStudent = async (req, res) => {
  const body = req.body || {};
  const id = req.params.id ? Number(req.params.id) : null;
  const requestedStudentId = body.student_id ? Number(body.student_id) : null;
  const admissionNo = Number(body.admission_no);
  const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : '';
  const lastName = typeof body.last_name === 'string' ? body.last_name.trim() : '';
  const gender = typeof body.gender === 'string' && body.gender ? body.gender : null;
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const birth = body.date_of_birth || null;
  const admissionDate = body.admission_date || null;
  const classId = body.class_id ? Number(body.class_id) : null;
  const rollNo = body.roll_no ? Number(body.roll_no) : null;
  const sessionId = body.session_id ? Number(body.session_id) : null;
  const optionalDate = (value) => !value || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)));

  if ((id !== null && (!Number.isSafeInteger(id) || id < 1)) || (!id && (!Number.isSafeInteger(requestedStudentId) || requestedStudentId < 1)) || !Number.isSafeInteger(admissionNo) || admissionNo < 1 || !firstName || firstName.length > 100 || lastName.length > 100 || (gender && !['Male', 'Female', 'Other'].includes(gender)) || phone.length > 30 || email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || address.length > 2000 || !optionalDate(birth) || !optionalDate(admissionDate) || ((classId || rollNo || sessionId) && (![classId, rollNo, sessionId].every(Number.isSafeInteger) || [classId, rollNo, sessionId].some((value) => value < 1)))) {
    return res.status(400).json({ error: 'Check the required fields and class assignment.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let studentId = id;
    if (id) {
      const result = await client.query(
        `UPDATE public.students SET admission_no=$1, first_name=$2, last_name=$3, gender=$4,
             date_of_birth=$5, phone=$6, email=$7, address=$8, admission_date=$9
         WHERE student_id=$10 RETURNING student_id`,
        [admissionNo, firstName, lastName || null, gender, birth, phone || null, email || null, address || null, admissionDate, id],
      );
      if (!result.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Student was not found.' }); }
    } else {
      const result = await client.query(
        `INSERT INTO public.students (student_id, admission_no, first_name, last_name, gender, date_of_birth, phone, email, address, admission_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING student_id`,
        [requestedStudentId, admissionNo, firstName, lastName || null, gender, birth, phone || null, email || null, address || null, admissionDate],
      );
      studentId = result.rows[0].student_id;
    }
    if (classId && rollNo && sessionId) {
      const assignment = await client.query(
        `UPDATE public.class_students SET class_id=$1, roll_no=$3
         WHERE student_id=$2 AND session_id=$4 RETURNING student_id`,
        [classId, studentId, rollNo, sessionId],
      );
      if (!assignment.rowCount) {
        await client.query(
          `INSERT INTO public.class_students (class_id, student_id, roll_no, session_id) VALUES ($1,$2,$3,$4)`,
          [classId, studentId, rollNo, sessionId],
        );
      }
    }
    await client.query('COMMIT');
    res.status(id ? 200 : 201).json({ student_id: studentId, message: id ? 'Student updated.' : 'Student added.' });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'Admission number or class roll number is already in use.' });
    if (error.code === '23503') return res.status(400).json({ error: 'Choose an existing class and academic session.' });
    console.error('Unable to save student:', error.message);
    res.status(503).json({ error: 'Student could not be saved right now.' });
  } finally {
    client.release();
  }
};
