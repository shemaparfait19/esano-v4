import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// GET /api/family-tree/subfamilies?ownerId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");
    if (!ownerId) {
      return NextResponse.json(
        { error: "ownerId is required" },
        { status: 400 }
      );
    }

    const ref = adminDb.collection("familyTrees").doc(ownerId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ items: [] });
    }
    const data = snap.data() as any;
    const items = Array.isArray(data.subfamilies) ? data.subfamilies : [];
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to load subfamilies", detail: e?.message || "" },
      { status: 500 }
    );
  }
}

// POST /api/family-tree/subfamilies  body: { ownerId, name, headMemberId?, memberIds? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerId, name, headMemberId, memberIds, description } = body as {
      ownerId?: string;
      name?: string;
      headMemberId?: string;
      memberIds?: string[];
      description?: string;
    };
    if (!ownerId || !name) {
      return NextResponse.json(
        { error: "ownerId and name are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const ref = adminDb.collection("familyTrees").doc(ownerId);
    const snap = await ref.get();
    const data = snap.exists ? (snap.data() as any) : {};
    const subfamilies = Array.isArray(data.subfamilies) ? data.subfamilies : [];

    const id = `subfam_${Date.now()}`;
    const newSubfamily = {
      id,
      name,
      description: description || "",
      headMemberId: headMemberId || undefined,
      memberIds: Array.isArray(memberIds) ? memberIds : [],
      parentFamilyId: ownerId,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(
      {
        subfamilies: [...subfamilies, newSubfamily],
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, subfamily: newSubfamily });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to create subfamily", detail: e?.message || "" },
      { status: 500 }
    );
  }
}
