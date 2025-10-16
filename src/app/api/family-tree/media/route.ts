import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const userId = form.get("userId") as string;
    const memberId = form.get("memberId") as string;
    const file = form.get("file") as File | null;
    const kind = (form.get("kind") as string) || "media"; // media | voice | timeline
    const title = (form.get("title") as string) || undefined;
    const date = (form.get("date") as string) || new Date().toISOString();

    if (!userId || !memberId || !file) {
      return NextResponse.json(
        { error: "userId, memberId and file are required" },
        { status: 400 }
      );
    }

    // Save file to local uploads folder
    const arrayBuffer = await file.arrayBuffer();
    const MAX_BYTES = 50 * 1024 * 1024; // 50 MB limit
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
    const filename = `${userId}_${memberId}_${timestamp}_${randomStr}.${extension}`;
    
    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });
    
    // Save file
    const filePath = join(uploadDir, filename);
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);
    
    // Public URL path
    const fileUrl = `/uploads/${folder}/${filename}`;

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
    await ref.set(tree, { merge: true } as any);
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (e: any) {
    console.error("Media upload error:", e);
    return NextResponse.json(
      { error: "Upload failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
