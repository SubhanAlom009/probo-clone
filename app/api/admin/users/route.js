import { verifyToken, adminDb as db } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";
import { getUserProfile } from "@/lib/db";

export async function GET(req) {
  try {
    const authUser = await verifyToken(req);
    const profile = await getUserProfile(authUser.uid);
    if (!profile || profile.role !== "admin") return err("Forbidden", 403);
    const qRef = db.collection("users").where("upgradeRequested", "==", true);
    const snap = await qRef.get();
    return json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    return err(e.message, 400);
  }
}
