import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { spApplications } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  try {
    if (req.method === "GET") {
      const applications = await db.select().from(spApplications).orderBy(desc(spApplications.createdAt));
      return Response.json(applications);
    }

    if (req.method === "POST") {
      const { name, phone, email, address, education, aadhaarBase64, panBase64, aadhaarType, panType } = await req.json();
      
      let aadhaarBlobKey = null;
      let panBlobKey = null;
      const store = getStore('sp-documents');

      if (aadhaarBase64) {
        aadhaarBlobKey = `aadhaar_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const buffer = Buffer.from(aadhaarBase64, 'base64');
        await store.set(aadhaarBlobKey, buffer, {
          metadata: { contentType: aadhaarType || 'application/octet-stream' }
        });
      }

      if (panBase64) {
        panBlobKey = `pan_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const buffer = Buffer.from(panBase64, 'base64');
        await store.set(panBlobKey, buffer, {
          metadata: { contentType: panType || 'application/octet-stream' }
        });
      }

      const [application] = await db.insert(spApplications).values({ 
        name, phone, email, address, education, aadhaarBlobKey, panBlobKey 
      }).returning();
      
      return Response.json(application, { status: 201 });
    }

    if (req.method === "DELETE") {
      const { id } = await req.json();
      const [deleted] = await db.delete(spApplications).where(eq(spApplications.id, id)).returning();
      if (!deleted) return new Response("Application not found", { status: 404 });
      return Response.json(deleted);
    }

    if (req.method === "PUT") {
      const { id, status, spId, isVerified, verifiedBy } = await req.json();
      
      const updateData: any = { status };
      if (spId !== undefined) updateData.spId = spId;
      if (isVerified !== undefined) updateData.isVerified = isVerified;
      if (verifiedBy !== undefined) updateData.verifiedBy = verifiedBy;

      const [updated] = await db.update(spApplications)
        .set(updateData)
        .where(eq(spApplications.id, id))
        .returning();
        
      if (!updated) {
        return new Response("Application not found", { status: 404 });
      }
      return Response.json(updated);
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error: any) {
    console.error("Error in sp-applications function:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/sp-applications",
};
