import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    if (!key) {
      return new Response("Missing key", { status: 400 });
    }

    const store = getStore("sp-documents");
    const result = await store.getWithMetadata(key, { type: "blob" });

    if (!result || !result.data) {
      return new Response("Document not found", { status: 404 });
    }

    return new Response(result.data, {
      headers: {
        "Content-Type": (result.metadata?.contentType as string) || "application/octet-stream",
      },
    });
  } catch (error: any) {
    console.error("Error in sp-documents function:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/sp-documents",
};