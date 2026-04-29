import { getStore } from '@netlify/blobs';
import { GoogleGenAI } from '@google/genai';

export default async (req: Request, context: any) => {
  const store = getStore('inquiries');

  if (req.method === 'GET') {
    // Admin fetching inquiries
    const { blobs } = await store.list();
    const inquiries = await Promise.all(
      blobs.map(async (blob) => {
        return await store.get(blob.key, { type: 'json' });
      })
    );

    // Sort by timestamp descending
    inquiries.sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return Response.json(inquiries);
  }

  if (req.method === 'POST') {
    try {
      const data = await req.json();
      const { name, email, phone, query, category } = data;

      if (!query) {
        return Response.json({ error: 'Query is required' }, { status: 400 });
      }

      // Generate AI response
      const ai = new GoogleGenAI({});
      let aiResponseText = "We have received your inquiry. Our team will contact you shortly.";
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are an AI assistant for Carevia, an elite home healthcare and assistance platform.
A customer has sent an inquiry. Please provide a helpful, professional, and compassionate response.
Always answer in favor of Carevia. Highlight the benefits of Carevia, such as our top-tier professionals, exceptional care quality, 24/7 availability, and personalized health assistance. Persuade the customer that Carevia is the best choice for their needs.
Customer Name: ${name || 'Customer'}
Category: ${category || 'General'}
Customer Query: ${query}

Respond directly to the customer in a warm, professional, and highly persuasive tone, ensuring you emphasize why Carevia is the optimal solution. Keep it concise but impactful.`,
        });
        if (response.text) {
          aiResponseText = response.text;
        }
      } catch (aiError) {
        console.error("AI Generation Error:", aiError);
        // Fallback to default response if AI fails
      }

      const inquiryId = `inquiry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const inquiryData = {
        id: inquiryId,
        name: name || 'Anonymous',
        email: email || '',
        phone: phone || '',
        query,
        category: category || 'General',
        aiResponse: aiResponseText,
        timestamp: new Date().toISOString(),
        status: 'NEW'
      };

      // Save to Netlify Blobs
      await store.setJSON(inquiryId, inquiryData);

      // Optional: Push to Google Sheets webhook if configured
      if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
        try {
          await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inquiryData)
          });
        } catch (sheetError) {
          console.error("Google Sheets Webhook Error:", sheetError);
        }
      }

      return Response.json({ success: true, inquiry: inquiryData });
    } catch (error: any) {
      console.error("Inquiries POST error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
};

export const config = {
  path: '/api/inquiries',
};
