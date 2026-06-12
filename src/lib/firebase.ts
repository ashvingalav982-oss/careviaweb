import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { DebugLogStore, validateFirebaseConfig } from '../utils/authDebug';

// Validate configuration on startup
const configValidation = validateFirebaseConfig(firebaseConfig);
if (!configValidation.valid) {
  console.error('[FIREBASE] Configuration validation failed:', configValidation.errors);
  DebugLogStore.addLog('FIREBASE_CONFIG', 'Validation failed', configValidation.errors);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Use the firestoreDatabaseId from the config
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const storage = getStorage(app);

// Connection test removed — reading from 'test' collection
// triggered "Missing or insufficient permissions" because
// no rule existed for that collection. Real operations
// will surface Firebase config errors with clear messages.

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) {
  if (error.code === 'permission-denied') {
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid || 'anonymous',
        email: auth.currentUser?.email || '',
        emailVerified: auth.currentUser?.emailVerified || false,
        isAnonymous: auth.currentUser?.isAnonymous || true,
        providerInfo: auth.currentUser?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    DebugLogStore.addLog('FIRESTORE_ERROR', 'Permission denied', errorInfo);
    throw new Error(JSON.stringify(errorInfo));
  }
  DebugLogStore.addLog('FIRESTORE_ERROR', `${operationType} operation failed`, { error: error.message, path });
  throw error;
}

