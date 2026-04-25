import { getStore } from '@netlify/blobs';
import nodemailer from 'nodemailer';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Netlify Blobs
    const store = getStore('otps');
    // Store OTP with an expiry time (e.g. 5 minutes from now)
    await store.setJSON(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    let transporter;
    let etherealUrl = null;

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
      etherealUrl = nodemailer.getTestMessageUrl(info);
      console.log('OTP sent. Preview URL: %s', etherealUrl);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'OTP sent successfully',
      previewUrl: etherealUrl // Return preview URL so frontend can log it if needed
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
