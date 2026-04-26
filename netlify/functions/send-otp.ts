import { getStore } from '@netlify/blobs';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { email, phone } = await req.json();

    if (!email && !phone) {
      return new Response(JSON.stringify({ error: 'Email or phone number is required' }), { status: 400 });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const identifier = email || phone;

    // Store in Netlify Blobs
    const store = getStore('otps');
    // Store OTP with an expiry time (e.g. 5 minutes from now)
    await store.setJSON(identifier, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    let previewUrl = null;

    if (email) {
      let transporter;
      if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        // Use Gmail if configured
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
          }
        });
      } else {
        // Use Ethereal Email for testing/free fallback
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      const info = await transporter.sendMail({
        from: '"CAREVIA Support" <noreply@carevia.app>',
        to: email,
        subject: 'Your CAREVIA Verification Code',
        text: `Your verification code is: ${otp}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-w-md; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
            <h2 style="color: #2dd4bf;">CAREVIA Login</h2>
            <p>Your verification code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #333;">${otp}</h1>
            <p>This code will expire in 5 minutes.</p>
          </div>
        `
      });

      if (!process.env.GMAIL_USER) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('OTP sent to email. Preview URL: %s', previewUrl);
      }
    } else if (phone) {
      // Send SMS using Twilio if configured
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Your CAREVIA verification code is: ${otp}. It expires in 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone.startsWith('+') ? phone : `+91${phone}`
        });
        console.log(`OTP sent to phone ${phone} via Twilio.`);
      } else {
        // Fallback for free testing: log the OTP
        console.log(`[FREE SMS SIMULATION] OTP for ${phone} is: ${otp}`);
        previewUrl = `sms-simulation:${otp}`;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'OTP sent successfully',
      previewUrl // Return preview URL or simulated OTP so frontend can log/display it if needed for testing
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send OTP' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
