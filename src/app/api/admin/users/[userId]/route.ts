import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/users/[userId]
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const updates = await request.json();

    // Validate allowed fields
    const allowedFields = ["isFamilyHead", "familyTreeApproved", "displayName"];
    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    filteredUpdates.updatedAt = new Date().toISOString();

    await adminDb.collection("users").doc(userId).update(filteredUpdates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user", detail: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId]
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Delete Firebase Auth user
    try {
      await adminAuth.deleteUser(userId);
      console.log(`✅ Deleted Firebase Auth user: ${userId}`);
    } catch (authError: any) {
      console.error("Failed to delete auth user:", authError);
      // Continue even if auth deletion fails (user might not exist in auth)
    }

    // Delete user document from Firestore
    await adminDb.collection("users").doc(userId).delete();
    console.log(`✅ Deleted Firestore user document: ${userId}`);

    // Delete related data
    try {
      // Delete user's family tree
      await adminDb.collection("familyTrees").doc(userId).delete();
      console.log(`✅ Deleted family tree for user: ${userId}`);
    } catch (e) {
      // Tree might not exist
    }

    try {
      // Delete family tree applications
      const apps = await adminDb
        .collection("familyTreeApplications")
        .where("userId", "==", userId)
        .get();
      
      const batch = adminDb.batch();
      apps.docs.forEach((doc: any) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`✅ Deleted ${apps.docs.length} applications for user: ${userId}`);
    } catch (e) {
      console.error("Failed to delete applications:", e);
    }

    return NextResponse.json({ 
      success: true, 
      message: "User and all related data deleted successfully" 
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user", detail: error.message },
      { status: 500 }
    );
  }
}
