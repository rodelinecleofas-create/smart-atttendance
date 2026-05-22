import admin from 'firebase-admin';

let adminAuth;
let adminDb;

function initializeAdminApp() {
  if (adminAuth && adminDb) {
    return;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    return;
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (error) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must contain valid JSON.');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  adminAuth = admin.auth();
  adminDb = admin.firestore();
}

export function getAdminAuth() {
  initializeAdminApp();
  if (!adminAuth) {
    throw new Error(
      'Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable. This is required for server-side Firebase admin operations.'
    );
  }
  return adminAuth;
}

export function getAdminDb() {
  initializeAdminApp();
  if (!adminDb) {
    throw new Error(
      'Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable. This is required for server-side Firebase admin operations.'
    );
  }
  return adminDb;
}
