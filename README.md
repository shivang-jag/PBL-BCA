# PBL (Project Based Learning) Management System

Tech:
- Frontend: React (Vite) + TailwindCSS
- Backend: Node.js + Express
- Database: MongoDB
- ODM: Mongoose

## Folder structure

```
backend/
  src/
    app.js
    server.js
    config/
      db.js
    controllers/
      authController.js
      academicController.js
      teamController.js
    middleware/
      auth.js
      error.js
    models/
      User.js
      Year.js
      Subject.js
      Team.js
    routes/
      authRoutes.js
      academicRoutes.js
      teamRoutes.js
    seed/
      seed.js
    utils/
      jwt.js

frontend/
  public/
    college-bg.svg
    college-logo.svg
  src/
    components/
      CreateTeam.jsx
    context/
      AuthContext.jsx
    lib/
      api.js
      session.js
    pages/
      LoginPage.jsx
      StudentDashboard.jsx
      AdminDashboard.jsx
    App.jsx
    main.jsx
    index.css
```

## Run locally

### 1) MongoDB
Start MongoDB locally (default expected URI in backend `.env`):

`mongodb://127.0.0.1:27017/pbl`

### 2) Backend

From `backend/`:

1. Create env file: copy `.env.example` to `.env` and adjust values if needed.
2. Seed pre-created admin + sample Years/Subjects:
   - `npm run seed`
3. Start dev server:
   - `npm run dev`

Backend runs on `http://localhost:5000`.

### 3) Frontend

From `frontend/`:

1. Create env file: copy `.env.example` to `.env`.
2. Start dev server:
   - `npm run dev`

Frontend runs on `http://localhost:5173`.

## Authentication & flow

### Student/Faculty (dev Google simulation)
Frontend uses `POST /api/auth/google-dev` and stores the returned JWT.

### Admin
Admins are pre-created via seed script (no public registration). Frontend uses `POST /api/auth/admin/login`.

### Teacher
Teachers can view and grade only teams assigned to them via `team.mentor.email`.

For quick testing, the seed script can upsert a default teacher user:
- Configure in `backend/.env` (or copy from `backend/.env.example`):
  - `SEED_TEACHER_EMAIL` (default `teacher@pbl.local`)
  - `SEED_TEACHER_NAME` (default `Teacher`)
- Run from `backend/`: `npm run seed`

### Student panel (Team Creation)
Rules enforced strictly by backend:
- Select Year + Subject (Subject must belong to Year)
- Team Name unique per (Year, Subject)
- Exactly 4 members, exactly 1 leader
- No duplicate email or roll within team
- No member can exist in another team for the same (Year, Subject)
- On submit, team status becomes `FINALIZED` (no update/delete endpoints)

Marks:
- Teachers can enter marks (0–100) and remarks per member.
- Students never receive marks in API responses (server-side sanitization).

Google Sheets (optional):
- If Sheets env vars are not configured, Sheets operations are skipped (non-blocking).
- Mentor sync updates only `mentor.name` and `mentor.email` based on a `Team ID` column.

Dev login redirect:
- After `POST /api/auth/google-dev`, the frontend redirects based on `user.role`:
  - `student` → `/student/dashboard`
  - `teacher` → `/teacher/dashboard`
  - `admin` → `/admin/panel`
- You can set the dev identity using query params (no UI changes):
  - `http://localhost:5173/login?devEmail=teacher@pbl.local&devName=Teacher`

## Example API requests (curl)

### Student dev login
```bash
curl -X POST http://localhost:5000/api/auth/google-dev \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"student1@pbl.dev\",\"name\":\"Student 1\"}"
```

### Admin login
```bash
curl -X POST http://localhost:5000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@pbl.local\",\"secretCode\":\"<ADMIN_SECRET>\"}"
```

⚠️ Security Note: The example admin email is seeded by default for local development. Change/remove default seeded admin accounts and rotate `ADMIN_SECRET` before deploying to production or any shared/non-local environment.

### List years / subjects
```bash
curl http://localhost:5000/api/years -H "Authorization: Bearer <JWT>"
curl "http://localhost:5000/api/subjects?yearId=<YEAR_ID>" -H "Authorization: Bearer <JWT>"
```

### Create team (FINALIZED)
```bash
curl -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d "{\
    \"yearId\":\"<YEAR_ID>\",\
    \"subjectId\":\"<SUBJECT_ID>\",\
    \"teamName\":\"Alpha Squad\",\
    \"members\":[\
      {\"name\":\"Student 1\",\"email\":\"student1@pbl.dev\",\"rollNumber\":\"22CS001\",\"isLeader\":true},\
      {\"name\":\"Member 2\",\"email\":\"m2@pbl.dev\",\"rollNumber\":\"22CS002\",\"isLeader\":false},\
      {\"name\":\"Member 3\",\"email\":\"m3@pbl.dev\",\"rollNumber\":\"22CS003\",\"isLeader\":false},\
      {\"name\":\"Member 4\",\"email\":\"m4@pbl.dev\",\"rollNumber\":\"22CS004\",\"isLeader\":false}\
    ]\
  }"
```

### Read-only view (my team)
```bash
curl "http://localhost:5000/api/teams/my?yearId=<YEAR_ID>&subjectId=<SUBJECT_ID>" \
  -H "Authorization: Bearer <JWT>"
```
