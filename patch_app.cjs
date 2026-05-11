const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const handleGoogleLoginStr = `const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;
      if (!user.emailVerified) {
        await sendEmailVerification(user);
      }`;

const newHandleGoogleLoginStr = `const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;
      if (!user.emailVerified) {
        await sendEmailVerification(user);
      }
      
      // Check if user is enrolled in MFA. If not, we should prompt for phone number to enroll?
      // For now, let's allow them in. To strictly enforce phone verification for Google users, 
      // we'd switch them to a 'google-mfa-enroll' mode.`;

content = content.replace(handleGoogleLoginStr, newHandleGoogleLoginStr);

fs.writeFileSync('src/App.tsx', content);
