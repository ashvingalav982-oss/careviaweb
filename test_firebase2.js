import { initializeApp } from 'firebase/app';
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);

const actionCodeSettings = {
  url: 'http://localhost:8888',
  handleCodeInApp: true,
};

sendSignInLinkToEmail(auth, "test@example.com", actionCodeSettings).then(() => {
  console.log("Success");
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
