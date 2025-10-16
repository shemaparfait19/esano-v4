import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST multipart/form-data: userId, file
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const userId = String(form.get("userId") || "").trim();
    const file = form.get("file") as File | null;
    if (!userId || !file) {
      return NextResponse.json(
        { error: "Missing userId or file" },
        { status: 400 }
      );
    }
    // Basic size/type checks
    const allowed =
      /^(text\/|application\/octet-stream)/.test(file.type) ||
      /\.(txt|csv|tsv|zip|gz)$/i.test(file.name);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (!allowed) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload raw text-like DNA exports." },
        { status: 415 }
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.byteLength > maxSize) {
      return NextResponse.json(
        { error: "File too large. Max 10 MB." },
        { status: 413 }
      );
    }

    // Store DNA data directly in Firestore (no file system needed)
    const fileName = file.name || `dna_${Date.now()}.txt`;

    // Extract text sample for matching
    const textSample = buf.toString("utf8").slice(0, 1_000_000);
    
    // Save to Firestore (database storage only)
    const doc = {
      userId,
      fileName,
      uploadDate: new Date().toISOString(),
      fileSize: buf.byteLength,
      status: "active" as const,
      backend: "firestore" as const,
      textSample,
      fullData: textSample, // Store full sample for analysis
    };
    
    const savedRef = await adminDb.collection("dna_data").add(doc);
    
    // Persist normalized text to user profile for fast matching
    try {
      console.log(`[DNA Upload] Saving to users/${userId}:`, {
        dnaDataLength: textSample.length,
        fileName,
      });
      
      await adminDb.collection("users").doc(userId).set(
        {
          userId,
          dnaData: textSample,
          dnaFileName: fileName,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      
      console.log(`[DNA Upload] Successfully saved to users/${userId}`);
    } catch (err) {
      console.error("[DNA Upload] Failed to update user profile:", err);
      throw err; // Re-throw to notify client
    }
    
    return NextResponse.json({ ok: true, id: savedRef.id, ...doc });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to upload DNA" },
      { status: 500 }
    );
  }
}

