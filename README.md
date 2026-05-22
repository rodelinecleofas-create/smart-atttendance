# Smart Attend

Smart Attend is a school attendance management system built with Next.js, Tailwind CSS, Firebase, and Recharts. It helps administrators, teachers, students, and parents manage attendance with role-based access, reporting, and communication tools.

## What the System Does

- Provides secure Firebase authentication for users with roles: Admin, Teacher, Parent, and Student.
- Lets teachers and admins record daily attendance using categories like Present, Absent, Late, Excused, Sick, Permission, and Leave.
- Enables admin users to manage student data, import/export CSV rosters, and view student profile details.
- Generates attendance reports, charts, and analytics for trends, percentages, and record review.
- Stores audit logs for key actions and allows review of attendance history and change tracking.
- Supports email notifications for attendance alerts and user verification reminders.

## Main Pages

- `/` — Home/landing page
- `/login` — Login page
- `/register` — Registration page (includes admin signup)
- `/dashboard` — Analytics dashboard
- `/attendance` — Attendance marking and tracking
- `/records` — Attendance record list
- `/reports` — Reports and exports
- `/settings` — Account settings
- `/admin` — Admin control panel
- `/admin/roster` — Bulk student import/export
- `/student/[id]` — Student profile page
- `/audit-logs` — Audit log review

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a Firebase project and enable Authentication and Firestore
4. Add Firebase configuration values to `.env.local`

### Required environment variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account", ...}
```

- `FIREBASE_SERVICE_ACCOUNT_KEY` must contain the Firebase service account JSON payload as a single-line string for server-side admin account creation.

## Run Locally

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Deployment

This app is configured for deployment on Vercel. Use the Vercel dashboard or CLI to deploy the `smart-attend` project.
