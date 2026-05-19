import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore/lite';
import { initializeApp } from 'firebase/app';

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

export async function POST(request) {
  try {
    const { reportType, filters = {} } = await request.json();

    let attendanceQuery = collection(db, 'attendance');
    const constraints = [];

    if (filters.fromDate) {
      constraints.push(where('date', '>=', new Date(filters.fromDate)));
    }
    if (filters.toDate) {
      const end = new Date(filters.toDate);
      end.setHours(23, 59, 59, 999);
      constraints.push(where('date', '<=', end));
    }
    if (filters.studentId) {
      constraints.push(where('studentId', '==', filters.studentId));
    }
    if (filters.classPeriod) {
      constraints.push(where('classPeriod', '==', filters.classPeriod));
    }

    const q = query(attendanceQuery, ...constraints, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || new Date(doc.data().date),
    }));

    // Get students data for summary
    const studentSnapshot = await getDocs(collection(db, 'students'));
    const students = studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const reportData = {
      type: reportType,
      generatedAt: new Date().toISOString(),
      records,
      students,
      filters,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
