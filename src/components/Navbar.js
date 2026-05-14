'use client';

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setRole(null);
        return;
      }

      setUser(currentUser);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      setRole(userDoc.exists() ? userDoc.data().role : null);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setOpen(false);
    router.push('/login');
  };

  return (
    <nav className="bg-blue-600 text-white">
      <div className="container mx-auto flex flex-wrap items-center justify-between px-4 py-4">
        <Link href="/" className="text-white text-xl font-bold">
          Smart Attend
        </Link>

        <button
          className="inline-flex items-center rounded-md border border-white/20 p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white md:hidden"
          type="button"
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="sr-only">Toggle navigation menu</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className={`${open ? 'block' : 'hidden'} w-full md:block md:w-auto`}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 mt-3 md:mt-0">
            {!user ? (
              <>
                <Link href="/login" className="rounded-md px-3 py-2 text-white hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="rounded-md px-3 py-2 text-white hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)}>
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="rounded-md px-3 py-2 text-white hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/attendance" className="rounded-md px-3 py-2 text-white hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)}>
                  Attendance
                </Link>
                <Link href="/records" className="rounded-md px-3 py-2 text-white hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)}>
                  Records
                </Link>
                {role === 'admin' && (
                  <Link href="/admin" className="rounded-md px-3 py-2 text-white hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)}>
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md px-3 py-2 text-white hover:bg-white/10 hover:text-white"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
