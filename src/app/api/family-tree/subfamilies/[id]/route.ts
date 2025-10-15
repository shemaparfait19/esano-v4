import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// PATCH /api/family-tree/subfamilies/[id]  body: { ownerId, updates }
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { ownerId, updates } = body as { ownerId?: string; updates?: any };
    const id = params.id;
    if (!ownerId || !id) {
      return NextResponse.json(
        { error: "ownerId and id are required" },
        { status: 400 }
      );
    }
    const ref = adminDb.collection("familyTrees").doc(ownerId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }
    const data = snap.data() as any;
    const subfamilies = Array.isArray(data.subfamilies) ? data.subfamilies : [];
    const idx = subfamilies.findIndex((s: any) => s.id === id);
    if (idx < 0) {
      return NextResponse.json(
        { error: "Subfamily not found" },
        { status: 404 }
      );
    }
    const now = new Date().toISOString();
    const updated = {
      ...subfamilies[idx],
      ...(updates || {}),
      updatedAt: now,
    };
    const next = subfamilies.map((s: any, i: number) =>
      i === idx ? updated : s
    );
    await ref.set({ subfamilies: next, updatedAt: now }, { merge: true });
    return NextResponse.json({ ok: true, subfamily: updated });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to update subfamily", detail: e?.message || "" },
      { status: 500 }
    );
  }
}

// DELETE /api/family-tree/subfamilies/[id]?ownerId=...
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");
    const id = params.id;
    if (!ownerId || !id) {
      return NextResponse.json(
        { error: "ownerId and id are required" },
        { status: 400 }
      );
    }
    const ref = adminDb.collection("familyTrees").doc(ownerId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }
    const data = snap.data() as any;
    const subfamilies = Array.isArray(data.subfamilies) ? data.subfamilies : [];
    const next = subfamilies.filter((s: any) => s.id !== id);
    const now = new Date().toISOString();
    await ref.set({ subfamilies: next, updatedAt: now }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to delete subfamily", detail: e?.message || "" },
      { status: 500 }
    );
  }
}
