'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';

export default function ProtectedPage({ children, requiredRole }) {
  const [status, setStatus] = useState('loading');
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      if (requiredRole) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userRole = userDoc.exists() ? userDoc.data().role : null;
        setRole(userRole);

        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const isAllowed = allowedRoles.includes(userRole) || userRole === 'admin';

        if (!isAllowed) {
          setStatus('unauthorized');
          return;
        }
      }

      setStatus('authorized');
    });

    return () => unsubscribe();
  }, [router, requiredRole]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-6 shadow-md text-center">
          <p className="text-lg font-medium text-gray-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-lg bg-white p-6 shadow-md text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Access denied</h1>
          <p className="mt-4 text-gray-600">You do not have the required permissions to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
