import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
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

/**
 * Validates connection to Firestore with debug logging
 */
async function testConnection() {
  try {
    const start = performance.now();
    await getDocFromServer(doc(db, 'test', 'connection'));
    const latency = Math.round(performance.now() - start);
    console.log(`✓ Firebase Connected successfully (${latency}ms)`);
    DebugLogStore.addLog('FIREBASE_CONNECTION', 'Connected', { latency });
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("✗ Please check your Firebase configuration.");
      DebugLogStore.addLog('FIREBASE_CONNECTION', 'Offline', { error: error.message });
    } else {
      console.warn("⚠ Initial connection test failed, but may succeed after auth:", error);
      DebugLogStore.addLog('FIREBASE_CONNECTION', 'Test failed (may retry after auth)', { error: String(error) });
    }
  }
}

// Run connection test on initialization
testConnection();

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

