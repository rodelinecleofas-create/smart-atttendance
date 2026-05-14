import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function logAudit(action, targetId, targetType, userId, details = {}) {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      targetId,
      targetType,
      userId,
      details,
      timestamp: serverTimestamp(),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

export const AUDIT_ACTIONS = {
  CREATE_ATTENDANCE: 'CREATE_ATTENDANCE',
  UPDATE_ATTENDANCE: 'UPDATE_ATTENDANCE',
  DELETE_ATTENDANCE: 'DELETE_ATTENDANCE',
  CREATE_STUDENT: 'CREATE_STUDENT',
  UPDATE_STUDENT: 'UPDATE_STUDENT',
  DELETE_STUDENT: 'DELETE_STUDENT',
  IMPORT_ROSTER: 'IMPORT_ROSTER',
  EXPORT_ROSTER: 'EXPORT_ROSTER',
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
};
