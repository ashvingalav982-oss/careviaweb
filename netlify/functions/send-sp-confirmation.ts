import nodemailer from 'nodemailer';
import twilio from 'twilio';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { email, phone, spId, name } = await req.json();

    if (!phone && !email) {
      return new Response(JSON.stringify({ error: 'Email or phone number is required' }), { status: 400 });
    }

    const messageText = `Hello ${name || 'Provider'},\nYour CAREVIA Service Provider application has been confirmed! Your unique SP ID is ${spId}. Use this to log in.`;

    let emailSent = false;
    let smsSent = false;

    // Send Email
    if (email) {
      try {
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

        await transporter.sendMail({
          from: '"CAREVIA" <noreply@carevia.app>',
          to: email,
          subject: 'CAREVIA Service Provider Application Confirmed!',
          text: messageText,
          html: `
            <div style="font-family: sans-serif; max-width: 448px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
              <h2 style="color: #2dd4bf;">Application Confirmed!</h2>
              <p>Hello ${name || 'Provider'},</p>
              <p>Your CAREVIA Service Provider application has been confirmed.</p>
              <p>Your unique SP ID is <strong>${spId}</strong>.</p>
              <p>Please use this SP ID to log in to your dashboard.</p>
              <br/>
              <p>Best regards,<br/>The CAREVIA Team</p>
            </div>
          `
        });
        emailSent = true;
      } catch (e) {
        console.error('Failed to send email:', e);
      }
    }

    // Send SMS
    if (phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: messageText,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone.startsWith('+') ? phone : `+91${phone}` // Defaulting to India code if not provided
        });
        smsSent = true;
      } catch (e) {
        console.error('Failed to send SMS via Twilio:', e);
      }
    } else if (phone) {
       console.log('Twilio credentials not found, logging SMS instead:', messageText);
       smsSent = true; // Pretend it was sent for dev
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailSent, 
      smsSent 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error sending SP confirmation:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config = {
  path: '/api/send-sp-confirmation',
};
