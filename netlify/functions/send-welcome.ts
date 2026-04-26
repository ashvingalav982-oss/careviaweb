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

    let transporter;
    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
    } else {
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
      from: '"CAREVIA" <noreply@carevia.app>',
      to: email,
      subject: 'Welcome to CAREVIA!',
      text: 'Thank you for joining CAREVIA. We are glad to have you on board.',
      html: `
        <div style="font-family: sans-serif; max-w-md; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
          <h2 style="color: #2dd4bf;">Welcome to CAREVIA!</h2>
          <p>Thank you for joining CAREVIA. We are dedicated to providing elite concierge healthcare and domestic management.</p>
          <p>We're thrilled to have you with us!</p>
          <br/>
          <p>Best regards,<br/>The CAREVIA Team</p>
        </div>
      `
    });

    let previewUrl = null;
    if (!process.env.GMAIL_USER) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Welcome email sent. Preview URL: %s', previewUrl);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Welcome email sent successfully',
      previewUrl
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send welcome email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
