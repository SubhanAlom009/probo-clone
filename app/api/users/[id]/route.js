import { verifyToken, adminDb } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";

export async function GET(req, { params }) {
  try {
    await verifyToken(req);
    const snap = await adminDb.collection("users").doc(params.id).get();
    if (!snap.exists) return err("User not found", 404);
    const data = snap.data();
    const toIso = (value) =>
      typeof value?.toDate === "function"
        ? value.toDate().toISOString()
        : value || null;
    // Return minimal safe profile info
    return json({
      user: {
        id: snap.id,
        displayName: data.displayName || "User",
        avatar: data.photoURL || data.avatar || null,
        isOnline: !!data.isOnline,
        lastSeen: toIso(data.lastSeen),
      },
    });
  } catch (e) {
    console.error("GET /api/users/[id] error:", e);
    return err("Failed to fetch user", 500);
  }
}
