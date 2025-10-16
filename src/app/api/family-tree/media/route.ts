import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    console.log('📤 Upload request received');
    const form = await request.formData();
    const userId = form.get("userId") as string;
    const memberId = form.get("memberId") as string;
    const file = form.get("file") as File | null;
    const kind = (form.get("kind") as string) || "media"; // media | voice | timeline | document
    const title = (form.get("title") as string) || undefined;
    const date = (form.get("date") as string) || new Date().toISOString();
    
    console.log('📋 Upload details:', { userId, memberId, kind, fileName: file?.name });

    if (!userId || !memberId || !file) {
      return NextResponse.json(
        { error: "userId, memberId and file are required" },
        { status: 400 }
      );
    }

    // Read file buffer
    console.log('💾 Reading file buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const MAX_BYTES = 50 * 1024 * 1024; // 50 MB limit
    console.log(`📊 File size: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max 50 MB." },
        { status: 413 }
      );
    }
    
    // Determine folder based on kind
    const folderMap: Record<string, string> = {
      media: "media",
      voice: "voice",
      timeline: "timeline",
      document: "documents"
    };
    const folder = folderMap[kind] || "media";
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'bin';
    const filename = `${folder}/${userId}/${memberId}/${timestamp}_${randomStr}.${extension}`;
    
    // Upload to Firebase Storage
    console.log('📤 Uploading to Firebase Storage...');
    const buffer = Buffer.from(arrayBuffer);
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filename);
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          userId,
          memberId,
          kind,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      },
    });
    
    // Make file publicly accessible
    await fileRef.makePublic();
    
    // Get public URL
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    console.log('✅ File uploaded to Storage:', fileUrl);
    
    // Store metadata in Firestore (without the large file content)
    console.log('💾 Saving metadata to Firestore...');
    await adminDb.collection("uploadedDocuments").add({
      userId,
      memberId,
      fileName: file.name,
      storedFileName: filename,
      fileType: file.type,
      fileSize: file.size,
      kind,
      url: fileUrl,
      uploadedAt: new Date().toISOString(),
    });

    const ref = adminDb.collection("familyTrees").doc(userId);
    const snap = await ref.get();
    let tree = snap.exists
      ? (snap.data() as any)
      : {
          id: userId,
          ownerId: userId,
          members: [],
          edges: [],
          settings: {
            colorScheme: "default",
            viewMode: "classic",
            layout: "horizontal",
            branchColors: {},
            nodeStyles: {},
          },
          annotations: [],
          version: { current: 1, history: [] },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    const members = Array.isArray(tree.members) ? tree.members : [];
    const idx = members.findIndex((m: any) => m.id === memberId);

    const applyToMember = (m: any) => {
      if (kind === "voice") {
        const voice = Array.isArray(m.voiceUrls) ? m.voiceUrls : [];
        return { ...m, voiceUrls: [...voice, fileUrl] };
      }
      if (kind === "document") {
        const docs = Array.isArray(m.documentUrls) ? m.documentUrls : [];
        return { ...m, documentUrls: [...docs, { url: fileUrl, name: file.name, uploadedAt: new Date().toISOString() }] };
      }
      if (kind === "timeline") {
        const timeline = Array.isArray(m.timeline) ? m.timeline : [];
        return {
          ...m,
          timeline: [
            ...timeline,
            {
              id: `tl_${Date.now()}`,
              type: file.type.startsWith("audio")
                ? "audio"
                : file.type.startsWith("video")
                ? "video"
                : "photo",
              date,
              title,
              url: fileUrl,
            },
          ],
        };
      }
      const media = Array.isArray(m.mediaUrls) ? m.mediaUrls : [];
      return { ...m, mediaUrls: [...media, fileUrl] };
    };

    if (idx >= 0) {
      // Update existing member
      tree.members = members.map((m: any, i: number) =>
        i === idx ? applyToMember(m) : m
      );
    } else {
      // Create a skeleton member so upload succeeds
      const skeleton = applyToMember({
        id: memberId,
        fullName: "",
        firstName: "",
        lastName: "",
        tags: [],
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      tree.members = [...members, skeleton];
    }

    tree.updatedAt = new Date().toISOString();
    // Merge to reduce overwrite risks
    console.log('💾 Saving to Firestore...');
    await ref.set(tree, { merge: true } as any);
    console.log('✅ Upload complete:', fileUrl);
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (e: any) {
    console.error("❌ Media upload error:", e);
    console.error("❌ Error stack:", e?.stack);
    console.error("❌ Error details:", JSON.stringify(e, null, 2));
    return NextResponse.json(
      { 
        error: "Upload failed", 
        detail: String(e?.message || e),
        stack: e?.stack,
      },
      { status: 500 }
    );
  }
}
