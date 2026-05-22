import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '../../../../lib/firebaseAdmin';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!idToken) {
      return NextResponse.json({ error: 'Authorization token is required.' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const requesterUid = decodedToken.uid;
    const requesterDoc = await adminDb.collection('users').doc(requesterUid).get();
    const requesterRole = requesterDoc.exists ? requesterDoc.data()?.role : null;

    if (requesterRole !== 'admin') {
      return NextResponse.json({ error: 'Only admin users may create new accounts.' }, { status: 403 });
    }

    const { email, name, password, role } = await request.json();

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Email, name, password, and role are required.' },
        { status: 400 }
      );
    }

    const normalizedRole = String(role).trim().toLowerCase();
    const validRoles = ['admin', 'teacher', 'student', 'parent'];

    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json(
        { error: `Role must be one of: ${validRoles.join(', ')}.` },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      displayName: String(name).trim(),
      emailVerified: false,
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
      email: String(email).trim().toLowerCase(),
      name: String(name).trim(),
      role: normalizedRole,
      createdAt: new Date(),
    });

    if (normalizedRole === 'student') {
      await adminDb.collection('students').add({
        userId: userRecord.uid,
        studentId: userRecord.uid,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      role: normalizedRole,
    });
  } catch (error) {
    console.error('Admin create-user error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to create user.' },
      { status: 500 }
    );
  }
}
