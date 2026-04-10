import { verifyToken, adminDb as db } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";

export async function GET(req) {
  try {
    const authUser = await verifyToken(req);
    const qB = db
      .collection("bets")
      .where("userId", "==", authUser.uid)
      .orderBy("createdAt", "desc")
      .limit(100);
    const snap = await qB.get();
    return json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    return err(e.message, 401);
  }
}
