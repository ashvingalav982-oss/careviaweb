import { getStore } from '@netlify/blobs';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { email, phone, otp } = await req.json();
    const identifier = email || phone;

    if (!identifier || !otp) {
      return new Response(JSON.stringify({ error: 'Email or phone and OTP are required' }), { status: 400 });
    }

    const store = getStore('otps');
    const storedData = await store.get(identifier, { type: 'json' });

    if (!storedData) {
      return new Response(JSON.stringify({ error: 'OTP expired or invalid' }), { status: 400 });
    }

    const { otp: storedOtp, expiresAt } = storedData as { otp: string, expiresAt: number };

    if (Date.now() > expiresAt) {
      await store.delete(identifier);
      return new Response(JSON.stringify({ error: 'OTP expired' }), { status: 400 });
    }

    if (storedOtp !== otp) {
      return new Response(JSON.stringify({ error: 'Invalid OTP' }), { status: 400 });
    }

    // Success! Delete the OTP
    await store.delete(identifier);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'OTP verified successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to verify OTP' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
