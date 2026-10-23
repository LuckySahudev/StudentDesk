<i class="fa-solid fa-sun"></i>
<i class="fa-solid fa-moon"></i>



Your dashboard currently uses this professional color palette:
PurposeColorPreviewMain Background#0f172aDark navyCard Backgroundrgba(255,255,255,0.08)Glass effectBorderrgba(255,255,255,0.1)Soft transparent borderPrimary Accent#6366f1IndigoSecondary Text#94a3b8Slate grayLight Text#cbd5e1Soft whiteMain Text#ffffffPure white

## Authentication

- Sign in at `/login` by choosing a role, entering its numeric ID, and entering the password.
- Student login reads `public.students(student_id, password)`; teacher login reads `public.teachers(teacher_id, password)` and uses the linked employee record for the display name. These tables do not have a `status` column in the supplied schema.
- Admin login reads `public.admins(admin_id, employee_id, password)` and the linked employee record for the display name.
- Successful logins use a PostgreSQL-backed session and an `HttpOnly`, `SameSite=Lax` cookie. Passwords are never stored in browser storage. Existing plaintext database passwords are upgraded to bcrypt hashes when their account next signs in successfully.
- Add `AUTH_SESSION_SECRET` to `.env` before production. Generate a value with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Production cookies require HTTPS.
- `POST /api/auth/logout` ends the session. `GET /api/auth/me` returns the signed-in account's non-sensitive identity.
