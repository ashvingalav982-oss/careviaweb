const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldMobileSend = `          if (phone.length < 10) throw new Error('Invalid phone number');
          const res = await fetch('/.netlify/functions/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
          if (data.previewUrl) console.log('OTP Preview:', data.previewUrl);
          setOtpSent(true);`;

const newMobileSend = `          if (phone.length < 10) throw new Error('Invalid phone number');
          const formattedPhone = phone.startsWith('+') ? phone : \`+91\${phone}\`;
          const verifier = setupRecaptcha();
          const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
          setConfirmationResult(result);
          setOtpSent(true);`;

const oldMobileVerify = `          if (!otp) throw new Error('Please enter the OTP');
          
          const res = await fetch('/.netlify/functions/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Invalid OTP');

          let role = 'customer';
          if (phone.startsWith('99')) role = 'provider';
          if (phone === '6377446920') role = 'admin';

          let user;
          const fakeEmail = phone + '@phone.carevia.app';
          try {
            const cred = await signInWithEmailAndPassword(auth, fakeEmail, phone + 'CareviaOTP!123');
            user = cred.user;
          } catch(err: any) {
            try {
              const cred = await createUserWithEmailAndPassword(auth, fakeEmail, phone + 'CareviaOTP!123');
              user = cred.user;
            } catch(e2: any) {
              if (e2.code === 'auth/email-already-in-use') {
                 const cred = await signInWithEmailAndPassword(auth, fakeEmail, phone + 'CareviaOTP!123');
                 user = cred.user;
              } else {
                 throw e2;
              }
            }
          }`;

const newMobileVerify = `          if (!otp) throw new Error('Please enter the OTP');
          if (!confirmationResult) throw new Error('Session expired, please try again.');
          
          const cred = await confirmationResult.confirm(otp);
          const user = cred.user;

          let role = 'customer';
          if (phone.startsWith('99')) role = 'provider';
          if (phone === '6377446920') role = 'admin';`;

const oldResendPhone = `        const res = await fetch('/.netlify/functions/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
        if (data.previewUrl) console.log('OTP Preview:', data.previewUrl);`;

const newResendPhone = `        const formattedPhone = phone.startsWith('+') ? phone : \`+91\${phone}\`;
        const verifier = setupRecaptcha();
        const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
        setConfirmationResult(result);`;

content = content.replace(oldMobileSend, newMobileSend);
content = content.replace(oldMobileVerify, newMobileVerify);
content = content.replace(oldResendPhone, newResendPhone);

fs.writeFileSync(path, content);
console.log("Replacements done!");
