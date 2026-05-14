import { NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
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
    const { students, action } = await request.json();

    if (action === 'import') {
      const results = { success: 0, failed: 0, errors: [] };

      for (let i = 0; i < students.length; i++) {
        try {
          const student = students[i];
          await addDoc(collection(db, 'students'), {
            ...student,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      return NextResponse.json(results);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const studentSnapshot = await getDocs(query(collection(db, 'students'), orderBy('name')));
    const students = studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Convert Firestore timestamps to ISO strings
    const studentsWithDates = students.map((student) => ({
      ...student,
      createdAt: student.createdAt?.toDate?.()?.toISOString() || student.createdAt,
      updatedAt: student.updatedAt?.toDate?.()?.toISOString() || student.updatedAt,
    }));

    return NextResponse.json(studentsWithDates);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
