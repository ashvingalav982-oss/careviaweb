# CAREVIA Google Login Debug Guide

## 🔍 Current Issues Identified

### 1. **Missing CORS Configuration**
- Google OAuth popups may be blocked due to missing CORS headers
- Firebase auth domain not properly configured

### 2. **Insufficient Error Logging**
- No detailed debug information captured for auth failures
- Hard to track where the login fails

### 3. **Unoptimized File Structure**
- Auth logic scattered across App.tsx
- No separation of concerns for auth handlers

---

## ✅ Fixes Applied

### New File Structure
```
src/
├── lib/
│   ├── auth/
│   │   └── googleAuth.ts          ✨ NEW: Google auth handler
│   ├── firebase.ts                 📝 UPDATED: Better error handling
│   └── workspace.ts
├── utils/
│   └── authDebug.ts               ✨ NEW: Debug logging utilities
├── services/                       ✨ NEW: Business logic (ready)
└── App.tsx
```

### Enhanced Vite Config
- Added CORS configuration for Google OAuth
- Configured proxy for Firebase identity toolkit
- Improved build settings with source maps

### New Debug System
- **DebugLogStore**: Local storage for debug logs (last 50 entries)
- **Network Diagnostics**: Test Firebase connectivity
- **Configuration Validation**: Check Firebase setup on startup
- **Debug Reports**: Export complete diagnostics for troubleshooting

---

## 🔧 How to Fix Google Login

### Step 1: Verify Firebase Console Setup

Go to [Firebase Console](https://console.firebase.google.com/):

1. Select your project: **gen-lang-client-0848094348**
2. Navigate to **Authentication** → **Sign-in providers**
3. Enable **Google**
4. Add OAuth redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:5173` (Vite default)
   - Your production domain (e.g., `https://carevia.app`)

### Step 2: Update Firebase Config

Your `firebase-applet-config.json` should have:
```json
{
  "projectId": "gen-lang-client-0848094348",
  "appId": "1:948313425033:web:b33b665a9b42293db8b258",
  "apiKey": "AIzaSyCNk38W6L-uSOguXbmJC-AE5Xc6w6p-vLk",
  "authDomain": "gen-lang-client-0848094348.firebaseapp.com",
  "storageBucket": "gen-lang-client-0848094348.firebasestorage.app",
  "messagingSenderId": "948313425033"
}
```

### Step 3: Test the Debug System

Open browser console (F12) and run:

```javascript
// Import debug utilities
import { 
  generateDebugReport, 
  runNetworkDiagnostics,
  DebugLogStore 
} from './src/utils/authDebug.ts';

// Run diagnostics
await runNetworkDiagnostics();

// View debug logs
DebugLogStore.getLogs();

// Generate full report
const report = await generateDebugReport();
console.log(report);
```

### Step 4: Update App.tsx to Use New Auth Handler

Find the `handleGoogleLogin` function and replace with:

```typescript
import { handleGoogleSignIn, authDebugLog } from './lib/auth/googleAuth';
import { DebugLogStore } from './utils/authDebug';

const handleGoogleLogin = async () => {
  setLoading(true);
  setError('');
  
  try {
    DebugLogStore.addLog('AUTH', 'Starting Google login');
    
    const result = await handleGoogleSignIn(auth, db, async (verificationId, resolver) => {
      // Handle MFA
      setVerificationId(verificationId);
      setResolver(resolver);
      setMode('mfa');
      setOtpSent(true);
    });
    
    if (result.success) {
      DebugLogStore.addLog('AUTH', 'Google login successful', { uid: result.user?.uid });
      onLogin();
      onClose();
    } else {
      setError(result.error || 'Login failed');
      DebugLogStore.addLog('AUTH', 'Google login failed', { error: result.error, code: result.errorCode });
    }
  } catch (err) {
    authDebugLog.error('Unexpected error', err);
    setError('An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};
```

---

## 📊 Common Google Login Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `auth/popup-blocked` | Browser popup blocker | User needs to allow popups |
| `auth/network-request-failed` | No internet connection | Check network connectivity |
| `auth/invalid-api-key` | Missing/invalid Firebase API key | Check firebase-applet-config.json |
| `auth/unauthorized-domain` | Domain not in OAuth redirect URIs | Add domain to Firebase Console |
| `auth/operation-not-allowed` | Google sign-in not enabled | Enable in Firebase Authentication |
| CORS errors in console | Missing CORS headers | Vite config now has CORS setup |

---

## 🐛 Debug Log Locations

1. **Browser Console**: Real-time debug messages with `[AUTH-DEBUG]` prefix
2. **Local Storage**: `localStorage.getItem('carevia_debug_logs')`
3. **Session Storage**: Debug session ID for tracking

### Export Logs for Support
```javascript
import { DebugLogStore } from './utils/authDebug';
const report = DebugLogStore.exportLogs();
console.save(report, 'debug-logs.json');
```

---

## 🚀 Next Steps

1. **Verify Firebase Console Settings** ✓ Check OAuth URIs
2. **Test with New Debug System** ✓ Run diagnostics
3. **Update App.tsx** ✓ Use new auth handler (see Step 4 above)
4. **Clear Browser Cache** ✓ `Ctrl+Shift+Delete`
5. **Test Login** ✓ Monitor console logs
6. **Export Debug Report** ✓ If still failing, share report

---

## 📞 Support Commands

Run these in browser console for quick troubleshooting:

```javascript
// Check if online
navigator.onLine

// View all auth logs
localStorage.getItem('carevia_debug_logs')

// Test Firebase connection
fetch('https://gen-lang-client-0848094348.firebaseapp.com')

// Check current user
import { auth } from './src/lib/firebase';
auth.currentUser

// Force logout and retry
import { signOut } from 'firebase/auth';
await signOut(auth);
```

---

## 📝 File Organization Benefits

| Module | Purpose |
|--------|---------|
| `src/lib/auth/googleAuth.ts` | Google OAuth logic, proper error handling, MFA support |
| `src/utils/authDebug.ts` | Debug logging, network diagnostics, config validation |
| `src/services/` | (Ready for) Business logic (emails, data operations) |
| `vite.config.ts` | CORS, proxy, build optimization |

This separation makes code:
- ✅ **Maintainable**: Auth logic in one place
- ✅ **Debuggable**: Comprehensive logging
- ✅ **Scalable**: Easy to add more auth providers
- ✅ **Testable**: Pure functions, no side effects
