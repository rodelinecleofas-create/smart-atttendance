# Smart Attend

An efficient attendance management system built with Next.js, Tailwind CSS, and Firebase.

## Features

- User authentication with Firebase Auth
- Mark attendance for students
- View attendance records
- Responsive design with Tailwind CSS
- Real-time database with Firebase Firestore

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase project and add configuration to `.env.local`
4. Run the development server: `npm run dev`

## Environment Variables

Create a `.env.local` file with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Deployment

Deploy to Vercel for easy hosting and integration with GitHub.