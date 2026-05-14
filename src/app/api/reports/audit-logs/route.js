import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

export const dynamic = 'force-dynamic';

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

const db = getFirestore(app);

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');
    const action = searchParams.get('action');
    const limitCount = parseInt(searchParams.get('limit') || '50');

    const constraints = [];

    if (targetId) {
      constraints.push(where('targetId', '==', targetId));
    }
    if (targetType) {
      constraints.push(where('targetType', '==', targetType));
    }
    if (action) {
      constraints.push(where('action', '==', action));
    }

    const q = query(
      collection(db, 'auditLogs'),
      ...constraints,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
    }));

    return NextResponse.json({ logs, count: logs.length });
  } catch (error) {
    console.error('Audit log retrieval error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
