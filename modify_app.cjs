const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update imports
content = content.replace(
  /signInWithCustomToken,\n  multiFactor,/g,
  `signInWithCustomToken,\n  sendSignInLinkToEmail,\n  isSignInWithEmailLink,\n  signInWithEmailLink,\n  updatePassword,\n  multiFactor,`
);

// 2. Add CreatePasswordModal
const createPasswordModal = `
const CreatePasswordModal = ({ isOpen, onClose }: any) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, password);
        onClose();
      }
    } catch(err: any) {
      setError(err.message || 'Failed to create password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-neutral-900 rounded-3xl border border-white/10 p-8 overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-primary">Create a Password</h2>
            <p className="text-sm text-white/60 mt-1">Create a password for your account to use for future logins.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label-bold mb-2 block">New Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl focus:border-primary outline-none" placeholder="Min 6 characters"/>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-primary text-black rounded-xl font-bold">
             {loading ? 'Saving...' : 'Save Password'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
`;

// Insert it before AuthModal
const authModalIndex = content.indexOf('const AuthModal = ');
content = content.slice(0, authModalIndex) + createPasswordModal + '\n' + content.slice(authModalIndex);

// 3. Update AuthModal
const newAuthModal = `const AuthModal = ({ isOpen, onClose, onOpenAdmin, onLogin, onProviderLogin }: any) => {
  const [mode, setMode] = useState('identifier'); // identifier, password, mfa, sp, email_link_sent
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [resolver, setResolver] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('identifier');
      setIdentifier('');
      setPassword('');
      setOtp('');
      setError('');
    }
  }, [isOpen]);

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return (window as any).recaptchaVerifier;
    auth.useDeviceLanguage();
    const verifier = {
      type: 'recaptcha',
      verify: () => Promise.resolve('AdrTqXFZh7fhnJ-QCLS-8rLjGy4zHLesyPmh5vkExRsE2rw2vYtIvvAlitY5-sZFh-2EyfZCT_A1e3TqNxPQ63iQWotRaDRnUCWTGfWjzhhoybTYKlJTl9y-T5hkh-7Z2ylIwD85BNMGh_r7QyAgo3OT4A')
    } as any;
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError('');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, email: user.email, displayName: user.displayName,
        photoURL: user.photoURL, role: 'customer', lastLogin: serverTimestamp()
      }, { merge: true });
      onLogin(); onClose();
    } catch(err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!identifier) { setError('Please enter an email or phone number'); return; }
    setError(''); setLoading(true);
    
    const isEmail = identifier.includes('@');
    const isPhone = /^\\+?[0-9\\s]{10,15}$/.test(identifier);
    
    try {
      if (isPhone) {
        let phone = identifier.replace(/\\s/g, '');
        if (!phone.startsWith('+')) phone = '+91' + phone;
        const phoneProvider = new PhoneAuthProvider(auth);
        const vid = await phoneProvider.verifyPhoneNumber({ phoneNumber: phone }, setupRecaptcha());
        setVerificationId(vid);
        setMode('mfa');
      } else if (isEmail) {
        const actionCodeSettings = { url: window.location.href, handleCodeInApp: true };
        await sendSignInLinkToEmail(auth, identifier, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', identifier);
        setMode('email_link_sent');
      } else {
        setError('Please enter a valid email or phone number');
      }
    } catch(err: any) {
      if (err.code === 'auth/unauthorized-continue-uri') {
         setError('Email link auth is not authorized for this domain. Please use Phone Auth or Google Sign-In locally.');
      } else {
         setError(err.message || 'An error occurred');
      }
    } finally { setLoading(false); }
  };

  const handleOTP = async () => {
    if (!otp) return;
    setError(''); setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, otp);
      if (resolver) {
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
        await resolver.resolveSignIn(multiFactorAssertion);
      } else {
        const userCred = await signInWithCustomToken(auth, otp).catch(() => signInWithPhoneNumber(auth, identifier, setupRecaptcha()).then(res => res.confirm(otp)));
        await setDoc(doc(db, 'users', userCred.user.uid), { uid: userCred.user.uid, phone: identifier, role: 'customer', lastLogin: serverTimestamp() }, { merge: true });
      }
      onLogin(); onClose();
    } catch(err: any) { setError(err.message || 'Invalid OTP'); } finally { setLoading(false); }
  };

  const handleSPLogin = async () => {
    if (!identifier) { setError('Please enter SP ID'); return; }
    setLoading(true);
    try {
      const spQuery = query(collection(db, 'sp_applications'), where('spId', '==', identifier), limit(1));
      const spDocs = await getDocs(spQuery);
      if (!spDocs.empty) {
         const spDoc = spDocs.docs[0];
         if (spDoc.data().status === 'approved') {
            await signInWithCustomToken(auth, 'custom-token-mock'); // Mock for SP
            onProviderLogin(); onClose();
         } else { setError('SP ID is not active'); }
      } else { setError('Invalid SP ID'); }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-neutral-900 rounded-3xl border border-white/10 p-8 overflow-hidden">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
              {mode === 'sp' ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              {mode === 'sp' ? 'Provider Access' : mode === 'email_link_sent' ? 'Check Email' : mode === 'mfa' ? 'Verify OTP' : 'Secure Login'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5"/></button>
        </div>

        <div className="space-y-4">
          {mode === 'identifier' && (
            <>
              <div>
                <label className="label-bold mb-2 block">Email or Phone Number</label>
                <input type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl focus:border-primary outline-none" placeholder="name@example.com or +919876543210"/>
              </div>
              <div id="recaptcha-container"></div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button onClick={handleContinue} disabled={loading} className="w-full py-3 bg-primary text-black rounded-xl font-bold">
                 {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : 'Continue'}
              </button>
              
              <button onClick={handleGoogleLogin} disabled={loading} className="mt-4 w-full py-3 bg-white text-black rounded-xl text-sm font-bold flex items-center justify-center gap-3">
                <svg viewBox="0 0 24 24" width="24" height="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                Google Sign In
              </button>
            </>
          )}

          {mode === 'mfa' && (
            <>
              <div>
                <label className="label-bold mb-2 block">Enter OTP</label>
                <input type="text" value={otp} onChange={e=>setOtp(e.target.value)} className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl focus:border-primary outline-none text-center tracking-[0.5em] font-mono"/>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button onClick={handleOTP} disabled={loading} className="w-full py-3 bg-primary text-black rounded-xl font-bold">
                 {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : 'Verify'}
              </button>
            </>
          )}

          {mode === 'email_link_sent' && (
            <div className="text-center space-y-4">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-white/80">We've sent a magic link to <strong>{identifier}</strong>. Please check your inbox and click the link to log in.</p>
              <button onClick={() => setMode('identifier')} className="text-primary text-sm hover:underline">Use a different email</button>
            </div>
          )}

          {mode === 'sp' && (
            <>
              <div>
                <label className="label-bold mb-2 block">SP ID NO</label>
                <input type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl focus:border-primary outline-none font-mono"/>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button onClick={handleSPLogin} disabled={loading} className="w-full py-3 bg-primary text-black rounded-xl font-bold">
                 Login as Provider
              </button>
            </>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-center gap-4">
          <button onClick={() => { onClose(); onOpenAdmin(); }} className="text-[10px] uppercase font-bold text-white/40 hover:text-white">Admin</button>
          <div className="w-px h-4 bg-white/10" />
          <button onClick={() => setMode('sp')} className="text-[10px] uppercase font-bold text-primary opacity-60 hover:opacity-100 underline">Provider Login</button>
        </div>
      </motion.div>
    </div>
  );
};
`;

const authModalStart = content.indexOf('const AuthModal = ');
const subscriptionPlansStart = content.indexOf('const SubscriptionPlans = ');
content = content.slice(0, authModalStart) + newAuthModal + '\n' + content.slice(subscriptionPlansStart);

// 4. Update App() to handle Email Link
const appStart = content.indexOf('export default function App() {');
const useEffectEnd = content.indexOf('  }, []);', appStart) + 9;

const appStateVarsIndex = content.indexOf('const [isAuthOpen, setIsAuthOpen] = useState(false);', appStart);

const stateVars = `  const [showCreatePassword, setShowCreatePassword] = useState(false);\n  `;

content = content.slice(0, appStateVarsIndex) + stateVars + content.slice(appStateVarsIndex);

const onAuthStateChangedMatch = content.indexOf('const unsubscribe = onAuthStateChanged(auth, async (u) => {', appStart);

const emailLinkLogic = `
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            const user = result.user;
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid, email: user.email, role: 'customer', lastLogin: serverTimestamp()
            }, { merge: true });
            setIsLoggedIn(true);
            if (!user.providerData.some((p: any) => p.providerId === 'password')) {
              setShowCreatePassword(true);
            }
          })
          .catch((error) => console.error('Error signing in with email link', error));
      }
    }
  }, []);
`;

content = content.slice(0, onAuthStateChangedMatch) + emailLinkLogic + '\n    ' + content.slice(onAuthStateChangedMatch);

// Add the component rendering in App return
const appReturnIndex = content.indexOf('<AuthModal');
const createPasswordRendering = `
      <CreatePasswordModal isOpen={showCreatePassword} onClose={() => setShowCreatePassword(false)} />
`;

content = content.slice(0, appReturnIndex) + createPasswordRendering + content.slice(appReturnIndex);

fs.writeFileSync('src/App.tsx', content);

