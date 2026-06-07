#!/usr/bin/env node
/**
 * CAREVIA Google Login Diagnostic Script
 * Run this to diagnose Google login issues
 * 
 * Usage: node scripts/diagnose-google-login.cjs
 */

const fs = require('fs');
const path = require('path');

// Use project root directory
const projectRoot = process.cwd();

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║        CAREVIA Google Login Diagnostic Tool                    ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Test 1: Check Firebase Config
console.log('📋 Test 1: Checking Firebase Configuration...\n');

const configPath = path.join(projectRoot, 'firebase-applet-config.json');
let firebaseConfig;

try {
  const configContent = fs.readFileSync(configPath, 'utf-8');
  firebaseConfig = JSON.parse(configContent);
  
  console.log('✓ firebase-applet-config.json found');
  console.log(`  Project ID: ${firebaseConfig.projectId}`);
  console.log(`  App ID: ${firebaseConfig.appId}`);
  console.log(`  Auth Domain: ${firebaseConfig.authDomain}`);
  console.log(`  API Key present: ${!!firebaseConfig.apiKey}`);
  
  const requiredFields = ['projectId', 'appId', 'apiKey', 'authDomain', 'storageBucket'];
  const missing = requiredFields.filter(f => !firebaseConfig[f]);
  
  if (missing.length > 0) {
    console.error(`\n✗ Missing required fields: ${missing.join(', ')}`);
  } else {
    console.log('\n✓ All required Firebase fields present\n');
  }
} catch (err) {
  console.error(`✗ Error reading firebase config: ${err.message}\n`);
}

// Test 2: Check vite.config.ts for CORS
console.log('📋 Test 2: Checking Vite Configuration...\n');

const viteConfigPath = path.join(projectRoot, 'vite.config.ts');

try {
  const viteContent = fs.readFileSync(viteConfigPath, 'utf-8');
  const hasCORS = viteContent.includes('cors');
  const hasProxy = viteContent.includes('proxy');
  
  if (hasCORS) {
    console.log('✓ CORS configuration found');
  } else {
    console.warn('⚠ CORS configuration missing (may cause OAuth issues)');
  }
  
  if (hasProxy) {
    console.log('✓ Proxy configuration found');
  } else {
    console.warn('⚠ Proxy configuration missing');
  }
  console.log();
} catch (err) {
  console.error(`✗ Error reading vite config: ${err.message}\n`);
}

// Test 3: Check auth module structure
console.log('📋 Test 3: Checking Auth Module Structure...\n');

const authModules = [
  { path: 'src/lib/auth/googleAuth.ts', required: true },
  { path: 'src/utils/authDebug.ts', required: true },
  { path: 'src/lib/firebase.ts', required: true }
];

let allModulesPresent = true;

for (const module of authModules) {
  const fullPath = path.join(projectRoot, module.path);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`✓ ${module.path}`);
  } else {
    console.error(`✗ ${module.path} ${module.required ? '(REQUIRED)' : '(optional)'}`);
    if (module.required) allModulesPresent = false;
  }
}

if (allModulesPresent) {
  console.log('\n✓ All required auth modules present\n');
} else {
  console.error('\n✗ Some required auth modules are missing\n');
}

// Test 4: Check App.tsx for google login handler
console.log('📋 Test 4: Checking App.tsx Implementation...\n');

const appPath = path.join(projectRoot, 'src/App.tsx');

try {
  const appContent = fs.readFileSync(appPath, 'utf-8');
  
  const hasGoogleLogin = appContent.includes('handleGoogleLogin');
  const hasGoogleProvider = appContent.includes('GoogleAuthProvider');
  const hasSignInWithPopup = appContent.includes('signInWithPopup');
  
  if (hasGoogleLogin && hasGoogleProvider && hasSignInWithPopup) {
    console.log('✓ Google login implementation found');
  } else {
    console.warn('⚠ Google login implementation incomplete');
    console.log(`  - handleGoogleLogin: ${hasGoogleLogin ? '✓' : '✗'}`);
    console.log(`  - GoogleAuthProvider: ${hasGoogleProvider ? '✓' : '✗'}`);
    console.log(`  - signInWithPopup: ${hasSignInWithPopup ? '✓' : '✗'}`);
  }
  console.log();
} catch (err) {
  console.error(`✗ Error reading App.tsx: ${err.message}\n`);
}

// Test 5: NPM Dependencies
console.log('📋 Test 5: Checking NPM Dependencies...\n');

const packagePath = path.join(projectRoot, 'package.json');

try {
  const packageContent = fs.readFileSync(packagePath, 'utf-8');
  const packageJson = JSON.parse(packageContent);
  
  const requiredDeps = {
    'firebase': 'Firebase SDK',
    'react': 'React library',
    '@vitejs/plugin-react': 'Vite React plugin'
  };
  
  let allDepsPresent = true;
  
  for (const [dep, desc] of Object.entries(requiredDeps)) {
    if (packageJson.dependencies[dep]) {
      console.log(`✓ ${dep} (${packageJson.dependencies[dep]})`);
    } else {
      console.error(`✗ ${dep} missing`);
      allDepsPresent = false;
    }
  }
  
  if (allDepsPresent) {
    console.log('\n✓ All required dependencies present\n');
  } else {
    console.error('\n✗ Some dependencies missing - run: npm install\n');
  }
} catch (err) {
  console.error(`✗ Error reading package.json: ${err.message}\n`);
}

// Summary
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                    DIAGNOSTIC SUMMARY                         ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📌 Next Steps to Fix Google Login:\n');

console.log('1. Firebase Console Setup:');
console.log('   □ Go to https://console.firebase.google.com/');
console.log('   □ Select project: gen-lang-client-0848094348');
console.log('   □ Navigate to Authentication → Sign-in providers');
console.log('   □ Enable Google sign-in');
console.log('   □ Add authorized redirect URIs:');
console.log('     • http://localhost:3000');
console.log('     • http://localhost:5173');
console.log('     • (Your production domain)\n');

console.log('2. Test in Browser Console (F12):');
console.log('   ```javascript');
console.log('   // Check if online');
console.log('   navigator.onLine');
console.log('   ');
console.log('   // View auth logs');
console.log('   import { DebugLogStore } from "./src/utils/authDebug.ts"');
console.log('   DebugLogStore.getLogs()');
console.log('   ');
console.log('   // Generate debug report');
console.log('   import { generateDebugReport } from "./src/utils/authDebug.ts"');
console.log('   await generateDebugReport()');
console.log('   ```\n');

console.log('3. Development Server:');
console.log('   □ npm install');
console.log('   □ npm run dev');
console.log('   □ Visit http://localhost:3000 or 5173\n');

console.log('4. Clear Cache & Test:');
console.log('   □ Clear browser cache (Ctrl+Shift+Delete)');
console.log('   □ Open F12 DevTools → Console');
console.log('   □ Try Google login button');
console.log('   □ Check for [AUTH-DEBUG] messages\n');

console.log('📖 Full guide: See GOOGLE_LOGIN_DEBUG.md\n');

process.exit(0);
