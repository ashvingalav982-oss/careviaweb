import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  User,
  Auth,
  MultiFactorError,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';

export interface GoogleLoginResult {
  success: boolean;
  user?: User;
  error?: string;
  errorCode?: string;
  requiresMFA?: boolean;
  verificationId?: string;
}

/**
 * Debug logger for auth issues
 */
export const authDebugLog = {
  info: (msg: string, data?: any) => {
    console.log(`[AUTH-DEBUG] ${msg}`, data || '');
  },
  error: (msg: string, error: any) => {
    console.error(`[AUTH-ERROR] ${msg}`, {
      code: error?.code,
      message: error?.message,
      full: error
    });
  },
  warn: (msg: string, data?: any) => {
    console.warn(`[AUTH-WARN] ${msg}`, data || '');
  }
};

/**
 * Initialize Google Provider with proper configuration
 */
export function initGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  
  // Request required scopes
  provider.addScope('profile');
  provider.addScope('email');
  
  // Set redirect URL for OAuth
  provider.setCustomParameters({
    'login_hint': '',
    'prompt': 'select_account'
  });
  
  authDebugLog.info('Google Provider initialized');
  return provider;
}

/**
 * Handle Google Sign-In with comprehensive error handling
 */
export async function handleGoogleSignIn(
  auth: Auth,
  db: Firestore,
  onMFARequired?: (verificationId: string, resolver: any) => Promise<void>
): Promise<GoogleLoginResult> {
  const provider = initGoogleProvider();
  
  try {
    authDebugLog.info('Starting Google Sign-In popup...');
    
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;
    
    authDebugLog.info('Google Sign-In successful', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    // Store user in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'customer',
      walletBalance: null,
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      authProvider: 'google'
    }, { merge: true });
    
    authDebugLog.info('User profile saved to Firestore');
    
    return {
      success: true,
      user,
      error: undefined
    };
    
  } catch (err: any) {
    authDebugLog.error('Google Sign-In failed', err);
    
    // Handle Multi-Factor Authentication requirement
    if (err.code === 'auth/multi-factor-auth-required') {
      authDebugLog.warn('MFA required', { code: err.code });
      
      const res = getMultiFactorResolver(auth, err);
      
      if (res.hints[0].factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
        authDebugLog.info('Phone-based MFA detected');
        
        if (onMFARequired) {
          const verificationId = err.verificationId || '';
          await onMFARequired(verificationId, res);
        }
        
        return {
          success: false,
          requiresMFA: true,
          errorCode: 'auth/multi-factor-auth-required',
          error: 'Multi-Factor Authentication required'
        };
      }
    }
    
    // Handle common errors
    const errorMessages: { [key: string]: string } = {
      'auth/account-exists-with-different-credential': 
        'Account exists with different credentials. Please sign in with the correct method.',
      'auth/popup-closed-by-user': 
        'Sign-in popup was closed. Please try again.',
      'auth/network-request-failed': 
        'Network error. Please check your internet connection.',
      'auth/cancelled-popup-request': 
        'Sign-in was cancelled. Please try again.',
      'auth/operation-not-allowed': 
        'Google sign-in is not enabled. Contact support.',
      'auth/permission-denied': 
        'Permission denied. Please try again.',
      'auth/internal-error':
        'Internal Firebase error. Please try again later.',
      'auth/invalid-api-key':
        'Firebase configuration error. Contact support.',
    };
    
    const errorMessage = errorMessages[err.code] || (
      err.message?.includes('Firebase:') 
        ? 'A Gmail Sign-In error occurred. Please try again.'
        : err.message || 'Unknown error occurred'
    );
    
    return {
      success: false,
      error: errorMessage,
      errorCode: err.code
    };
  }
}

/**
 * Check if browser supports popup auth
 */
export function isPopupSupported(): boolean {
  try {
    const popup = window.open('', '_blank', 'width=100,height=100');
    if (popup) {
      popup.close();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get user-friendly error message
 */
export function getAuthErrorMessage(errorCode: string, fallback: string = 'An error occurred'): string {
  const messages: { [key: string]: string } = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'Email is already in use.',
    'auth/weak-password': 'Password is too weak.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'This operation is not allowed.',
  };
  
  return messages[errorCode] || fallback;
}
