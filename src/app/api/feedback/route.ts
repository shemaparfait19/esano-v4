import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST: Submit feedback
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userName, userEmail, type, subject, message, priority } = body;

    if (!message || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log('[Feedback] New submission:', { type, subject, userId });

    const feedbackData = {
      userId: userId || "anonymous",
      userName: userName || "Anonymous User",
      userEmail: userEmail || "",
      type, // suggestion, complaint, bug, feature, other
      subject: subject || "No subject",
      message,
      priority: priority || "medium", // low, medium, high
      status: "pending", // pending, reviewed, resolved, dismissed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNotes: "",
      resolvedAt: null,
      resolvedBy: null,
    };

    const docRef = await adminDb.collection("feedback").add(feedbackData);

    console.log('[Feedback] Saved with ID:', docRef.id);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Thank you for your feedback!",
    });
  } catch (e: any) {
    console.error("[Feedback] Error:", e);
    return NextResponse.json(
      { error: "Failed to submit feedback", detail: e?.message },
      { status: 500 }
    );
  }
}

// GET: Get all feedback (admin only)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // TODO: Verify admin permission
    if (!adminId) {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 }
      );
    }

    console.log('[Feedback] Admin fetch:', { adminId, status, type });

    let query = adminDb.collection("feedback").orderBy("createdAt", "desc");

    if (status) {
      query = query.where("status", "==", status) as any;
    }

    if (type) {
      query = query.where("type", "==", type) as any;
    }

    const snapshot = await query.limit(100).get();

    const feedback = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('[Feedback] Returning', feedback.length, 'items');

    return NextResponse.json({ success: true, feedback });
  } catch (e: any) {
    console.error("[Feedback GET] Error:", e);
    return NextResponse.json(
      { error: "Failed to fetch feedback", detail: e?.message },
      { status: 500 }
    );
  }
}

// PATCH: Update feedback status (admin only)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, adminNotes, adminId } = body;

    if (!id || !adminId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log('[Feedback] Updating:', { id, status, adminId });

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === "resolved") {
        updateData.resolvedAt = new Date().toISOString();
        updateData.resolvedBy = adminId;
      }
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    await adminDb.collection("feedback").doc(id).update(updateData);

    console.log('[Feedback] Updated successfully');

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[Feedback PATCH] Error:", e);
    return NextResponse.json(
      { error: "Failed to update feedback", detail: e?.message },
      { status: 500 }
    );
  }
}
