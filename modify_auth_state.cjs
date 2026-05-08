const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Inside App(), let's modify onAuthStateChanged to show the CreatePasswordModal if needed.
// Wait, onAuthStateChanged fires every time the page reloads. We only want to show it right after they log in.
// Maybe I should add it to the Google login and Phone login success paths in AuthModal.

// Instead, I can just pass setShowCreatePassword to AuthModal as a prop!

content = content.replace(/<AuthModal\n/g, '<AuthModal\n        setShowCreatePassword={setShowCreatePassword}\n');
content = content.replace(/const AuthModal = \(\{ isOpen, onClose, onOpenAdmin, onLogin, onProviderLogin \}: any\) => \{/g, 'const AuthModal = ({ isOpen, onClose, onOpenAdmin, onLogin, onProviderLogin, setShowCreatePassword }: any) => {');

// For Google Login
content = content.replace(/onLogin\(\); onClose\(\);/g, `onLogin(); onClose();
      if (auth.currentUser && !auth.currentUser.providerData.some((p: any) => p.providerId === 'password')) {
        setShowCreatePassword(true);
      }`);

fs.writeFileSync('src/App.tsx', content);

