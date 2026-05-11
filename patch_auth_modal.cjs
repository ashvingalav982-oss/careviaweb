const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Phone Login support in handleAction
const handleActionOld = `      } else if (mode === 'login') {
        if (!email || !password) throw new Error('Please enter email and password');`;

const handleActionNew = `      } else if (mode === 'phone-login') {
        if (!phone) throw new Error('Please enter your mobile number');
        
        const formattedPhone = phone.startsWith('+') ? phone : \`+91\${phone}\`;
        const verifier = setupRecaptcha();
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
        
        (window as any).customerConfirmationResult = confirmationResult;
        setMode('phone-otp');
        setOtpSent(true);
        setLoading(false);
        return;
      } else if (mode === 'phone-otp') {
        if (!otp) throw new Error('Please enter the OTP');
        const confirmationResult = (window as any).customerConfirmationResult;
        if (!confirmationResult) throw new Error('Session expired. Please try again.');
        
        const result = await confirmationResult.confirm(otp);
        const user = result.user;
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          phone: phone,
          role: 'customer',
          lastLogin: serverTimestamp()
        }, { merge: true });
        
        onLogin();
        onClose();
        setLoading(false);
        return;
      } else if (mode === 'login') {
        if (!email || !password) throw new Error('Please enter email and password');`;

code = code.replace(handleActionOld, handleActionNew);

// 2. Add UI for Phone Login
const uiOld = `            {mode === 'sp' ? (`;
const uiNew = `            {mode === 'phone-login' || mode === 'phone-otp' ? (
              <div className="space-y-4">
                 {mode === 'phone-login' ? (
                   <div>
                     <label className="label-bold mb-2 block">Phone Number</label>
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
                 ) : (
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
                 )}
                 {error && (
                   <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                     <AlertTriangle className="w-3 h-3" /> {error}
                   </p>
                 )}
                 <div id="recaptcha-container"></div>
                 <Button variant="primary" className="w-full" onClick={handleAction} disabled={loading}>
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'phone-login' ? 'Send OTP' : 'Verify & Login'}
                 </Button>
              </div>
            ) : mode === 'sp' ? (`;

code = code.replace(uiOld, uiNew);

// 3. Update Title
const titleOld = `{mode === 'login' ? 'Secure Login' : mode === 'signup' ? 'Create Access' : mode === 'mfa' ? 'Verify Identity' : 'Provider Access'}`;
const titleNew = `{mode === 'login' ? 'Secure Login' : mode === 'signup' ? 'Create Access' : mode === 'mfa' ? 'Verify Identity' : mode === 'phone-login' || mode === 'phone-otp' ? 'Mobile Access' : 'Provider Access'}`;
code = code.replace(titleOld, titleNew);

// 4. Update the "Google" button to also show "Phone" login option if in email mode
const googleBtnOld = `          {mode !== 'sp' && mode !== 'mfa' && (
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-6 w-full py-3 bg-white text-black rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
              Google
            </button>
          )}`;

const googleBtnNew = `          {mode !== 'sp' && mode !== 'mfa' && mode !== 'phone-otp' && mode !== 'phone-login' && (
            <div className="flex flex-col gap-3 mt-6">
              <button 
                onClick={() => setMode('phone-login')}
                disabled={loading}
                className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <Smartphone className="w-5 h-5" />
                Continue with Mobile
              </button>
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 bg-white text-black rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                Google
              </button>
            </div>
          )}`;

code = code.replace(googleBtnOld, googleBtnNew);

fs.writeFileSync('src/App.tsx', code);
