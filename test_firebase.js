import { initializeApp } from 'firebase/app';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);

fetchSignInMethodsForEmail(auth, "test@example.com").then(methods => {
  console.log("Methods:", methods);
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
