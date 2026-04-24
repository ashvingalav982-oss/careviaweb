const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Clear MOCK_PROVIDERS
code = code.replace(/const MOCK_PROVIDERS = \[[^]*?\];/s, 'const MOCK_PROVIDERS: any[] = [];');

// 2. Clear reviews in ReviewsSection
code = code.replace(/const reviews = \[[^]*?\];/, 'const reviews: any[] = [];');

// 3. AdminDashboard cleanups
// Total Users
code = code.replace(/<p className="text-3xl font-bold">1,280<\/p>/g, '<p className="text-3xl font-bold">0</p>');
// Active Care
code = code.replace(/<p className="text-3xl font-bold">54<\/p>/g, '<p className="text-3xl font-bold">0</p>');
// Revenue
code = code.replace(/<p className="text-3xl font-bold">₹2\.4M<\/p>/g, '<p className="text-3xl font-bold">₹0</p>');
// Clear Logs
code = code.replace(/const \[logs, setLogs\] = useState<any\[\]>\(\[[^]*?\]\);/, 'const [logs, setLogs] = useState<any[]>([]);');

// 4. Remove Simulate incoming booking
code = code.replace(/\/\/ Simulate incoming booking for testing[^]*?\}, \[\]\);/s, '');

// 5. Change Logo
code = code.replace(/const Logo = \(\{ className \}: \{ className\?: string \}\) => \([^\)]*\);/, 
`const Logo = ({ className }: { className?: string }) => (
  <div className={\`flex items-center gap-3 \${className}\`}>
     <img src="/logo.png" alt="CAREVIA Logo" className="h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]" />
  </div>
);`);

// 6. AdminDashboard Lock Screen - Password
// We use a more precise regex to target only AdminDashboard's lock screen
code = code.replace(/const \[isLocked, setIsLocked\] = useState\(true\);/, "const [isLocked, setIsLocked] = useState(true);\n  const [secretCode, setSecretCode] = useState('');");

const handleVerifyReplacement = `  const handleVerify = () => {
    if (secretCode === 'CAREVIA_SECRET_MASTER') {
       setIsLocked(false);
    } else {
       alert("Invalid Secret Code");
    }
  };`;
code = code.replace(/const handleVerify = \(\) => \{[\s\S]*?setIsLocked\(false\);\s*\}\s*\};/s, handleVerifyReplacement);

const newLockScreen = `<div className="space-y-6">
              <div>
                <label className="label-bold mb-2 block text-left text-primary">Master Secret Code</label>
                <input 
                  type="password" 
                  value={secretCode || ''}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-center text-sm outline-none focus:border-primary tracking-[0.5em] font-mono" 
                  placeholder="••••••••••••" 
                />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 py-4 text-[10px]" onClick={onClose}>Cancel</Button>
                <Button variant="primary" className="flex-1 py-4 text-[10px]" onClick={handleVerify}>
                  Access Secure Hub
                </Button>
              </div>
           </div>`;

code = code.replace(/<h2 className="text-2xl font-bold uppercase tracking-tight mb-2">Admin Command Center<\/h2>[\s\S]*?<div className="space-y-6">[\s\S]*?\{step === 1 \?[\s\S]*?<Button variant="primary" className="flex-y-4 text-\[10px\]" onClick=\{handleVerify\}>[\s\S]*?<\/Button>\s*<\/div>\s*<\/div>/, `<h2 className="text-2xl font-bold uppercase tracking-tight mb-2">Admin Command Center</h2>
           <p className="text-xs text-white/40 uppercase tracking-[0.2em] mb-8 font-bold">Protocol: Secure 2-Step Gate</p>
           
           ` + newLockScreen);


// 7. Notification Sounds for Admin
const soundsCode = `
  const [providerSound] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const [customerSound] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3'));
  const [premiumSound] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3'));

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    
    // Listen for new users
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('updatedAt', 'desc'), limit(5)), (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
           const data = change.doc.data();
           // Only play if it's very recent (last 2 mins)
           if (data.updatedAt && (Date.now() - data.updatedAt.toMillis() < 120000)) {
               if (data.role === 'provider') providerSound.play().catch(()=>console.log('Audio error'));
               else customerSound.play().catch(()=>console.log('Audio error'));
           }
        }
      });
    });

    return () => {
      unsubUsers();
    };
  }, [profile]);
`;
code = code.replace(/const handleLogout = async \(\) => \{/, soundsCode + '\n  const handleLogout = async () => {');


// 8. Save Data to Excel automatically (Netlify Forms)
const netlifyFormCode = `
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
`;
code = code.replace(/const setupRecaptcha = \(\) => \{/, netlifyFormCode + '\n  const setupRecaptcha = () => {');

// Update setDoc in AuthModal to also call saveToExcel
code = code.replace(/await setDoc\(doc\(db, 'users', user\.uid\), \{[\s\S]*?lastLogin: serverTimestamp\(\)\s*\}, \{ merge: true \}\);/g, (match) => {
    return match + `\n          await saveToExcel({ uid: user.uid, role: role, phone: user.phoneNumber || '', email: user.email || '' });`;
});

// 9. Add Email Verification step after Email Google Auth
// In the email path, it's lines 662-671:
code = code.replace(/const user = result\.user;\s*await setDoc\(doc\(db, 'users', user\.uid\)/, `const user = result.user;
        if (!user.emailVerified) { try { await sendEmailVerification(user); alert('Verification email sent! Please check your inbox.'); } catch(e){} }
        await setDoc(doc(db, 'users', user.uid)`);

// 10. Ensure sendEmailVerification is imported
code = code.replace(/signInWithPhoneNumber\n\} from 'firebase\/auth';/, `signInWithPhoneNumber,\n  sendEmailVerification\n} from 'firebase/auth';`);

fs.writeFileSync('src/App.tsx', code);
