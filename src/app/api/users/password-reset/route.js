import { NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/firebase';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // TODO: Integrate with Firebase sendPasswordResetEmail
    // For now, just return success
    console.log(`Password reset requested for: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent',
      email,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
