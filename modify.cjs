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
     <img src="/logo.png" alt="CAREVIA Logo" className="h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]" />
  </div>
);`);

// 6. AdminDashboard Lock Screen - Password
code = code.replace(/const \[isLocked, setIsLocked\] = useState\(true\);/, `const [isLocked, setIsLocked] = useState(true);
  const [secretCode, setSecretCode] = useState('');`);

const handleVerifyReplacement = `  const handleVerify = () => {
    if (secretCode === 'CAREVIA_SECRET_MASTER') {
       setIsLocked(false);
    } else {
       alert("Invalid Secret Code");
    }
  };`;
code = code.replace(/const handleVerify = \(\) => \{[^]*?\};/s, handleVerifyReplacement);

const newLockScreen = `           <div className="space-y-6">
              <div>
                <label className="label-bold mb-2 block text-left text-primary">Master Secret Code</label>
                <input 
                  type="password" 
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-sm outline-none focus:border-primary text-center tracking-[0.5em] font-mono" 
                  placeholder="••••••••••••" 
                />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 py-4 text-[10px]" onClick={onClose}>Cancel</Button>
                <Button variant="primary" className="flex-y-4 text-[10px] w-full" onClick={handleVerify}>
                  Access Secure Hub
                </Button>
              </div>
           </div>`;
code = code.replace(/<div className="space-y-6">[^]*?<div className="flex gap-4">[^]*?<\/div>\s*<\/div>/s, newLockScreen);

fs.writeFileSync('src/App.tsx', code);
