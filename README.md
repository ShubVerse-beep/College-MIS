# College MIS

Production-style College Management System with a React frontend and a Node.js/Express backend.

## Apps

- `backend/`: REST API, JWT auth, MongoDB models, notifications, PDF reports.
- `frontend/`: React + Vite SPA for admin, faculty, and student portals.

## Quick Start

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Update MongoDB, JWT, cookie, and SMTP settings.
3. Install dependencies with `npm install`.
4. Run the API with `npm run dev`.

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Install dependencies with `npm install`.
3. Run the app with `npm run dev`.

## Default Ports

- Frontend: `5173`
- Backend: `5000`

## Bootstrap Flow

1. Open the frontend.
2. Use the setup page to create the first admin account.
3. Log in as admin and create faculty, students, and courses.
4. Publish the timetable, post attendance, upload marks, and send announcements.

