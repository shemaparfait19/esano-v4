import { NextResponse } from "next/server";
import {
  getMyConnectionRequests,
  respondToConnectionRequest,
  sendConnectionRequest,
} from "@/app/actions";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId)
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    const data = await getMyConnectionRequests(userId);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to load requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[POST /api/requests] Request body:', body);
    
    const { fromUserId, toUserId } = body;
    console.log('[POST /api/requests] fromUserId:', fromUserId, 'toUserId:', toUserId);
    
    if (!fromUserId || !toUserId) {
      console.error('[POST /api/requests] Missing params - fromUserId:', fromUserId, 'toUserId:', toUserId);
      return NextResponse.json({ 
        error: "Missing params",
        details: { fromUserId: !!fromUserId, toUserId: !!toUserId }
      }, { status: 400 });
    }
    
    console.log('[POST /api/requests] Calling sendConnectionRequest...');
    const res = await sendConnectionRequest(fromUserId, toUserId);
    console.log('[POST /api/requests] Success:', res);
    return NextResponse.json(res);
  } catch (e: any) {
    console.error('[POST /api/requests] Error:', e?.message || e);
    return NextResponse.json({ 
      error: "Failed to send",
      details: e?.message 
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status)
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    const res = await respondToConnectionRequest(id, status);
    // Mark corresponding notification as read if exists
    // (Best-effort, ignore errors)
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
