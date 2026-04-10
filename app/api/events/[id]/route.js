import { verifyToken, adminDb as db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/db";
import { json, err } from "@/lib/apiUtil";

export async function GET(_req, { params }) {
  const ref = db.collection("events").doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return err("Not found", 404);
  return json({ id: snap.id, ...snap.data() });
}

export async function PATCH(req, { params }) {
  try {
    const authUser = await verifyToken(req);
    const profile = await getUserProfile(authUser.uid);
    if (!profile || profile.role !== "admin") return err("Forbidden", 403);
    const body = await req.json();
    const allowed = {};
    if (body.status === "closed") allowed.status = "closed";
    if (body.closesAt) allowed.closesAt = body.closesAt;
    if (!Object.keys(allowed).length) return err("Nothing to update");
    allowed.updatedAt = FieldValue.serverTimestamp();
    await db.collection("events").doc(params.id).update(allowed);
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 400);
  }
}
