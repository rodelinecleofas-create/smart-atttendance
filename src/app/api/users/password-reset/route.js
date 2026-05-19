import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';

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
