# QUICK START: Google Login Integration

## ✅ Already Done (Files Created)

- ✓ `src/lib/auth/googleAuth.ts` - Google OAuth handler
- ✓ `src/utils/authDebug.ts` - Debug logging & diagnostics  
- ✓ `vite.config.ts` - Updated with CORS & proxy config
- ✓ `src/lib/firebase.ts` - Enhanced with debug logging
- ✓ `scripts/diagnose-google-login.cjs` - Diagnostic tool
- ✓ `GOOGLE_LOGIN_DEBUG.md` - Full troubleshooting guide

## 📋 REQUIRED STEPS TO COMPLETE

### Step 1: Verify Firebase Console (2 min)
```
1. Go to: https://console.firebase.google.com/
2. Select: gen-lang-client-0848094348
3. Auth → Sign-in Providers → Enable "Google"
4. Add Authorized Redirect URIs:
   • http://localhost:3000
   • http://localhost:5173
   • https://yourproduction.domain
5. Save
```

**Why?** Google OAuth won't work without these URIs configured.

---

### Step 2: Update App.tsx handleGoogleLogin() (5 min)

Find the `handleGoogleLogin` function (~line 554) and replace with:

```typescript
import { handleGoogleSignIn, authDebugLog } from './lib/auth/googleAuth';
import { DebugLogStore } from './utils/authDebug';

const handleGoogleLogin = async () => {
  setLoading(true);
  setError('');
  
  try {
    DebugLogStore.addLog('AUTH', 'Starting Google login');
    authDebugLog.info('Google login initiated by user');
    
    const result = await handleGoogleSignIn(auth, db, async (verificationId, resolver) => {
      // Handle MFA if required
      setVerificationId(verificationId);
      setResolver(resolver);
      setMode('mfa');
      setOtpSent(true);
    });
    
    if (result.success) {
      DebugLogStore.addLog('AUTH', 'Google login successful', { uid: result.user?.uid });
      onLogin();
      onClose();
    } else if (result.requiresMFA) {
      // MFA flow already handled in callback
      DebugLogStore.addLog('AUTH', 'MFA required', { verificationId: result.verificationId });
    } else {
      setError(result.error || 'Login failed');
      DebugLogStore.addLog('AUTH', 'Google login failed', { error: result.error, code: result.errorCode });
    }
  } catch (err) {
    authDebugLog.error('Unexpected error in Google login', err);
    setError('An unexpected error occurred. Check console for details.');
    DebugLogStore.addLog('AUTH', 'Unexpected error', { error: String(err) });
  } finally {
    setLoading(false);
  }
};
```

---

### Step 3: Run Development Server (2 min)

```bash
npm install    # Install/update dependencies
npm run dev    # Start development server
# Visit: http://localhost:3000 or 5173
```

---

### Step 4: Test & Debug (5 min)

1. **Clear Browser Cache**
   - Press: `Ctrl+Shift+Delete`
   - Select: "All time"
   - Click: "Clear data"

2. **Open DevTools Console** (F12)

3. **Try Google Login**
   - Click Google button
   - Watch for `[AUTH-DEBUG]` messages in console

4. **If it fails, run diagnostics:**
   ```javascript
   // In browser console, type:
   import { DebugLogStore, generateDebugReport } from '/src/utils/authDebug.ts'
   DebugLogStore.getLogs()                    // View all logs
   await generateDebugReport()                // Full diagnostic
   navigator.onLine                           // Check internet
   ```

---

## 🔧 Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| Popup blocked | Allow popups for localhost in browser settings |
| "Invalid redirect URI" | Add exact URL to Firebase Console > Auth |
| "auth/network-request-failed" | Check internet connection |
| "Popup closed" | Try again, it's usually a timing issue |
| CORS errors in console | Vite config is fixed, restart server |

---

## 📊 File Structure After Changes

```
src/
├── App.tsx                    (UPDATE ONLY handleGoogleLogin)
├── index.css
├── main.tsx
├── vite-env.d.ts
├── lib/
│   ├── auth/
│   │   └── googleAuth.ts      ✨ NEW: Google OAuth logic
│   ├── firebase.ts            (UPDATED: Debug logging)
│   └── workspace.ts
├── utils/
│   └── authDebug.ts           ✨ NEW: Debug & diagnostics
└── services/                  ✨ NEW: (Ready for future)
```

---

## ✨ New Features Available

### In Browser Console

```javascript
// 1. View all debug logs
import { DebugLogStore } from './src/utils/authDebug.ts'
DebugLogStore.getLogs()

// 2. Generate debug report for support
const report = await generateDebugReport()
console.log(report)

// 3. Check Firebase connectivity
await runNetworkDiagnostics()

// 4. Validate config
import { validateFirebaseConfig } from './src/utils/authDebug.ts'
import config from './firebase-applet-config.json'
validateFirebaseConfig(config)
```

### Command Line

```bash
# Check everything
node scripts/diagnose-google-login.cjs

# View TypeScript errors
npm run lint
```

---

## 📞 Still Having Issues?

1. **Check diagnostics**: `node scripts/diagnose-google-login.cjs`
2. **Read full guide**: `GOOGLE_LOGIN_DEBUG.md`
3. **Review browser logs**: F12 → Console → filter by "[AUTH"
4. **Export debug report**: See section above
5. **Verify Firebase Console**: OAuth URIs, Google provider enabled

---

## ⚡ Summary

- **File system improved**: Auth logic organized, debug tools added
- **Diagnostics ready**: Run `node scripts/diagnose-google-login.cjs` anytime
- **Main fix**: Update App.tsx handleGoogleLogin (Step 2 above)
- **Test mode**: npm run dev → F12 console → try login
- **Error tracking**: All failures logged with `[AUTH-DEBUG]` prefix

**Estimated total time: 15-20 minutes**

---

**Need help?** Check the imports at the top of this file - all new utilities are in `src/lib/auth/` and `src/utils/`
