# Smart Attend

A modern attendance management system built with Next.js, Tailwind CSS, and Firebase.

## Features

- Firebase Auth signup, login, and role-based access control
- Admin panel for students and attendance session management
- Attendance marking with duplicate prevention and undo support
- Filterable attendance reporting with edit/delete, export, and print options
- Responsive mobile navigation and admin-aware menu
- Firestore security rules for student, session, and attendance access

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

## Admin role

The first registered user is granted the `admin` role automatically. Additional users are created as `teacher` by default.

## Firebase Rules

The project includes `firestore.rules` for role-based access control. Deploy the rules with the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

## Deployment

Deploy to Vercel or Firebase Hosting for production.
