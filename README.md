# Smart Attend

A comprehensive attendance management system built with Next.js, Tailwind CSS, Firebase, and Recharts.

## ✨ Features

### Core Features
- Firebase Authentication (signup, login, password reset)
- Role-based access control (Admin, Teacher, Parent, Student)
- Admin panel for student and attendance session management
- Attendance marking with multiple statuses
- Filterable attendance reporting

### 📊 New Analytics & Reporting
- Real-time attendance charts and visualizations
- Weekly and monthly attendance trends
- Student-wise attendance summaries
- PDF export for reports
- CSV download capabilities
- Attendance percentage calculations

### 📋 Roster Management
- Bulk import students from CSV
- Bulk export student data
- Student profile pages with contact information
- Parent contact details management

### 📌 Attendance Statuses
- Present
- Absent
- Late
- Excused
- Sick
- Permission
- Leave
- Custom status labels support

### 👤 User Management
- Admin account management
- Teacher account creation
- Parent login views
- Student login views
- Account settings page
- Password change functionality

### 📧 Notifications
- Email alerts for absent students
- Verification email reminders
- Daily attendance summary emails
- Email notification service integration

### 📝 Audit & History
- Audit logging of all actions
- History tracking for attendance records
- User activity monitoring
- Change history view

### 🎨 UI/UX Improvements
- Dashboard with analytics cards
- Empty state screens
- Error handling and user feedback
- Loading states
- Responsive design
- Search and filter functionality
- Pagination support

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a Firebase project and enable Authentication and Firestore
4. Add your Firebase variables to `.env.local`

### Required environment variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin role

The first registered user is granted the `admin` role automatically. Additional users are created as `teacher` by default.

## Firebase Rules

The project includes `firestore.rules` for role-based access control. Deploy the rules with the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

## Pages and Features

- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Main dashboard with analytics
- `/attendance` - Mark attendance
- `/records` - View attendance records
- `/reports` - Generate reports and analytics
- `/settings` - Account settings and security
- `/admin` - Admin panel
- `/admin/roster` - Bulk import/export students
- `/student/[id]` - Student profile page
- `/audit-logs` - View audit logs

## Deployment

Deploy to Vercel or Firebase Hosting for production.
