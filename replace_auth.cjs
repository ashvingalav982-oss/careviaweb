const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Update imports
code = code.replace(
  `} from 'firebase/auth';`,
  `  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  getMultiFactorResolver
} from 'firebase/auth';`
);

// We need to replace the entire AuthModal component.
// We can find the start: `const AuthModal = ({ isOpen, onClose, onOpenAdmin, onLogin, onProviderLogin }: any) => {`
// And the end: `const SubscriptionPlans = `
const startIndex = code.indexOf('const AuthModal = ({');
const endIndex = code.indexOf('const SubscriptionPlans =');

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find AuthModal boundaries");
  process.exit(1);
}

const before = code.substring(0, startIndex);
const after = code.substring(endIndex);

const newAuthModal = `const AuthModal = ({ isOpen, onClose, onOpenAdmin, onLogin, onProviderLogin }: any) => {
  const [mode, setMode] = useState('login'); // login, signup, sp, mfa
  const [method, setMethod] = useState('email'); // mobile, email (kept for compatibility with old UI if needed)
  const [showPass, setShowPass] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [resolver, setResolver] = useState<any>(null);
  const [verificationId, setVerificationId] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOtpSent(false);
    setShowPass(false);
    setError('');
    setOtp('');
    setPhone('');
    setEmail('');
    setPassword('');
    setName('');
    setResolver(null);
    setVerificationId('');
    setConfirmationResult(null);
  }, [mode, isOpen]);

  const saveToExcel = async (userData: any) => {
    try {
      const formData = new URLSearchParams();
      formData.append('form-name', 'registrations');
      Object.keys(userData).forEach(key => formData.append(key, userData[key]));
      
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
    } catch (err) {
      console.error('Failed to save to Excel/Form', err);
    }
  };

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }
    auth.useDeviceLanguage();
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => {},
      'expired-callback': () => {}
    });
    verifier.render().then((widgetId) => {
      (window as any).recaptchaWidgetId = widgetId;
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const sendWelcomeEmail = async (userEmail: string) => {
    try {
      if (userEmail) {
        await fetch('/.netlify/functions/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });
      }
    } catch(e) { console.error('Error sending welcome email:', e); }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'customer',
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      }, { merge: true });
      
      try { await saveToExcel({ uid: user.uid, role: 'customer', phone: '', email: user.email || '' }); } catch(e) {}
      await sendWelcomeEmail(user.email || '');
      
      onLogin();
      onClose();
    } catch(err: any) {
      console.error(err);
      if (err.code === 'auth/multi-factor-auth-required') {
        const res = getMultiFactorResolver(auth, err);
        setResolver(res);
        
        // Handle MFA
        if (res.hints[0].factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
          const phoneInfoOptions = {
            multiFactorHint: res.hints[0],
            session: res.session
          };
          const phoneAuthProvider = new PhoneAuthProvider(auth);
          const verifier = setupRecaptcha();
          const vid = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, verifier);
          setVerificationId(vid);
          setMode('mfa');
          setOtpSent(true);
        } else {
          setError('Unsupported second factor.');
        }
      } else {
        setError(err.message || 'Google Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    setError('');
    setLoading(true);
    
    try {
      if (mode === 'mfa') {
        if (!otp) throw new Error('Please enter the OTP');
        
        if (resolver) { // MFA Sign in
          const cred = PhoneAuthProvider.credential(verificationId, otp);
          const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
          const userCred = await resolver.resolveSignIn(multiFactorAssertion);
          const user = userCred.user;
          
          await setDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp()
          }, { merge: true });
          
          onLogin();
          onClose();
        } else if (confirmationResult) { // MFA Enrollment during signup
          const cred = PhoneAuthProvider.credential(verificationId, otp);
          const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
          await multiFactor(auth.currentUser!).enroll(multiFactorAssertion, "Personal Phone");
          
          // Refresh user to apply MFA claims
          await auth.currentUser?.reload();
          
          onLogin();
          onClose();
        }
      } else if (mode === 'login') {
        if (!email || !password) throw new Error('Please enter email and password');
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const user = cred.user;
          
          await setDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp()
          }, { merge: true });
          
          onLogin();
          onClose();
        } catch(err: any) {
          if (err.code === 'auth/multi-factor-auth-required') {
            const res = getMultiFactorResolver(auth, err);
            setResolver(res);
            if (res.hints.length > 0 && res.hints[0].factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
              const phoneInfoOptions = {
                multiFactorHint: res.hints[0],
                session: res.session
              };
              const phoneAuthProvider = new PhoneAuthProvider(auth);
              const verifier = setupRecaptcha();
              const vid = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, verifier);
              setVerificationId(vid);
              setMode('mfa');
              setOtpSent(true);
            } else {
              throw new Error('Unsupported second factor.');
            }
          } else {
            throw err;
          }
        }
      } else if (mode === 'signup') {
        if (!email || !password || !phone) throw new Error('Please fill in all fields');
        if (phone.length < 10) throw new Error('Invalid phone number');
        
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          phone: phone,
          role: 'customer',
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
        
        try { await saveToExcel({ uid: user.uid, role: 'customer', phone, email }); } catch(e) {}
        await sendWelcomeEmail(user.email || '');
        
        // MFA Enrollment
        const session = await multiFactor(user).getSession();
        const formattedPhone = phone.startsWith('+') ? phone : \`+91\${phone}\`;
        const phoneInfoOptions = {
          phoneNumber: formattedPhone,
          session: session
        };
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const verifier = setupRecaptcha();
        const vid = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, verifier);
        
        setVerificationId(vid);
        setConfirmationResult(true);
        setMode('mfa');
        setOtpSent(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSPLogin = async () => {
    try {
      const spIdVal = email.trim();
      if (!spIdVal) throw new Error("Please enter SP ID NO");
      const q = query(collection(db, 'users'), where('spId', '==', spIdVal));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("Invalid SP ID NO");
      
      const provider = snap.docs[0].data();
      if (!provider.isVerified) throw new Error("Your application is pending or rejected.");
      
      onProviderLogin(provider);
      onClose();
    } catch(err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl w-full max-w-md overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
                {mode === 'sp' ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                {mode === 'login' ? 'Secure Login' : mode === 'signup' ? 'Create Access' : mode === 'mfa' ? 'Verify Identity' : 'Provider Access'}
              </h2>
              <p className="text-sm text-white/50 mt-2 font-medium">
                {mode === 'sp' ? 'Enter your authorized SP ID' : mode === 'mfa' ? 'Enter the security code sent to your phone' : 'CAREVIA Client Portal'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {mode === 'sp' ? (
              <div className="space-y-4">
                 <div>
                   <label className="label-bold mb-2 block">SP ID NO</label>
                   <div className="flex gap-2">
                     <div className="bg-white/5 border border-white/10 px-3 py-3 rounded-xl text-sm font-bold text-white/70"><ShieldCheck className="w-4 h-4"/></div>
                     <input 
                       type="text" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm focus:border-primary outline-none transition-colors font-mono tracking-wider" 
                       placeholder="SP-XXXXX" 
                     />
                   </div>
                 </div>
                 {error && (
                   <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                     <AlertTriangle className="w-3 h-3" /> {error}
                   </p>
                 )}
                 <Button variant="primary" className="w-full" onClick={handleSPLogin}>
                   Login as Provider
                 </Button>
              </div>
            ) : mode === 'mfa' ? (
              <div className="space-y-4">
                 <div>
                   <label className="label-bold mb-2 block">Verification Code (SMS)</label>
                   <input 
                     type="text" 
                     value={otp}
                     onChange={(e) => {
                       setOtp(e.target.value);
                       if (error) setError('');
                     }}
                     className="w-full bg-white/5 border border-white/10 focus:border-primary px-4 py-3 rounded-xl text-sm outline-none transition-all tracking-[0.5em] font-mono text-center" 
                     placeholder="XXXXXX" 
                   />
                 </div>
                 {error && (
                   <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                     <AlertTriangle className="w-3 h-3" /> {error}
                   </p>
                 )}
                 <div id="recaptcha-container"></div>
                 <Button variant="primary" className="w-full" onClick={handleAction} disabled={loading}>
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                 </Button>
              </div>
            ) : (
              <div className="space-y-4">
                 {mode === 'signup' && (
                   <>
                     <div>
                       <label className="label-bold mb-2 block">Full Name</label>
                       <input 
                         type="text" 
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm focus:border-primary outline-none transition-colors" 
                         placeholder="Enter your full name" 
                       />
                     </div>
                     <div>
                       <label className="label-bold mb-2 block">Phone Number (For MFA)</label>
                       <div className="flex gap-2">
                         <div className="bg-white/5 border border-white/10 px-3 py-3 rounded-xl text-sm font-bold text-white/70">+91</div>
                         <input 
                           type="tel" 
                           value={phone}
                           onChange={(e) => setPhone(e.target.value)}
                           className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm focus:border-primary outline-none transition-colors" 
                           placeholder="Enter mobile number" 
                         />
                       </div>
                     </div>
                   </>
                 )}
                 <div>
                   <label className="label-bold mb-2 block">Email Address</label>
                   <div className="flex gap-2">
                     <div className="bg-white/5 border border-white/10 px-3 py-3 rounded-xl text-sm font-bold text-white/70"><Mail className="w-4 h-4"/></div>
                     <input 
                       type="email" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm focus:border-primary outline-none transition-colors" 
                       placeholder="Enter your email" 
                     />
                   </div>
                 </div>
                 <div>
                   <label className="label-bold mb-2 block">Password</label>
                   <div className="flex gap-2 relative">
                     <div className="bg-white/5 border border-white/10 px-3 py-3 rounded-xl text-sm font-bold text-white/70"><Lock className="w-4 h-4"/></div>
                     <input 
                       type={showPass ? "text" : "password"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm focus:border-primary outline-none transition-colors" 
                       placeholder="Enter your password" 
                     />
                     <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-3 text-white/50 hover:text-white">
                        {showPass ? 'Hide' : 'Show'}
                     </button>
                   </div>
                 </div>
                 
                 {error && (
                   <motion.p 
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2 flex items-center gap-2"
                   >
                     <AlertTriangle className="w-3 h-3" /> {error}
                   </motion.p>
                 )}
                 
                 <div id="recaptcha-container"></div>
                 <Button variant="primary" className="w-full" onClick={handleAction} disabled={loading}>
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                 </Button>
              </div>
            )}
          </div>

          {mode !== 'sp' && mode !== 'mfa' && (
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-6 w-full py-3 bg-white text-black rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
              Google
            </button>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-3">
            {mode === 'login' ? (
              <p className="text-sm text-white/60">
                New to CAREVIA? <button onClick={() => setMode('signup')} className="text-primary font-bold hover:underline">Create Account</button>
              </p>
            ) : mode === 'signup' ? (
              <p className="text-sm text-white/60">
                Already have an account? <button onClick={() => setMode('login')} className="text-primary font-bold hover:underline">Sign In</button>
              </p>
            ) : null}
            <div className="flex justify-center gap-4 pt-4">
               <button 
                 onClick={() => { onClose(); onOpenAdmin(); }}
                 className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
               >
                 Admin Entrance
               </button>
               <div className="w-px h-4 bg-white/10" />
               <button 
                 onClick={() => { setMode('sp'); }}
                 className="text-[10px] uppercase tracking-widest font-bold text-primary opacity-60 hover:opacity-100 transition-all underline decoration-primary/30 underline-offset-4"
               >
                 Provider Login
               </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
`

fs.writeFileSync('src/App.tsx', before + newAuthModal + after);
console.log("Updated src/App.tsx successfully");
