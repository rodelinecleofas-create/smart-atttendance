import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // App already initialized
}

const auth = getAuth(app);

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await firebaseSendPasswordResetEmail(auth, email);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent if the account exists.',
      email,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to send password reset email.' },
      { status: 500 }
    );
  }
}
