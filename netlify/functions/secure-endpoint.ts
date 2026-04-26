export default async (req: Request) => {
  // Check the HTTP method
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Basic Security Check: Expecting a custom API Key in the headers
  const authHeader = req.headers.get('Authorization');
  const expectedSecret = process.env.API_SECRET_KEY || 'default-secure-key-change-me-in-production';

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized', 
      message: 'A valid Bearer token is required to access this endpoint.' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle the request securely
  try {
    let requestData = {};
    if (req.method === 'POST') {
      requestData = await req.json();
    }

    // This is where you would interact with a database, etc.
    const secureData = {
      success: true,
      message: "You have successfully accessed the secure backend.",
      serverTime: new Date().toISOString(),
      receivedData: requestData,
      // You can return sensitive information or database records here
      data: [
        { id: 1, info: "Confidential Project Alpha" },
        { id: 2, info: "Secure User Metrics" }
      ]
    };

    return new Response(JSON.stringify(secureData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Optional: CORS headers if needed for specific domains
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
