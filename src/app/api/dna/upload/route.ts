import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";

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

    // Upload to Firebase Storage (local storage)
    const fileName = file.name || `dna_${Date.now()}.txt`;
    const storagePath = `dna/${userId}/${fileName}`;
    
    // Upload file to Firebase Storage
    const storageFile = adminStorage.bucket().file(storagePath);
    await storageFile.save(buf, {
      contentType: file.type || "text/plain",
      metadata: {
        contentType: file.type || "text/plain",
        metadata: {
          userId,
          uploadDate: new Date().toISOString(),
        },
      },
    });

    // Make file publicly accessible (optional - adjust based on your security needs)
    await storageFile.makePublic();
    const fileUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${storagePath}`;

    // Extract text sample for matching
    const textSample = buf.toString("utf8").slice(0, 1_000_000);
    
    // Save metadata to Firestore
    const doc = {
      userId,
      fileName,
      fileUrl,
      storagePath,
      uploadDate: new Date().toISOString(),
      fileSize: buf.byteLength,
      status: "active" as const,
      backend: "firebase_storage" as const,
      textSample,
    };
    
    const savedRef = await adminDb.collection("dna_data").add(doc);
    
    // Persist normalized text to user profile for fast matching
    try {
      await adminDb.collection("users").doc(userId).set(
        {
          userId,
          dnaData: textSample,
          dnaFileName: fileName,
          dnaFileUrl: fileUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to update user profile:", err);
    }
    
    return NextResponse.json({ ok: true, id: savedRef.id, ...doc });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to upload DNA" },
      { status: 500 }
    );
  }
}

