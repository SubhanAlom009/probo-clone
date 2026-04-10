import { verifyToken, adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { json, err } from "@/lib/apiUtil";

export async function POST(req) {
  try {
    const authUser = await verifyToken(req);
    const { amount } = await req.json();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return err("Invalid amount", 400);

    const userRef = adminDb.collection("users").doc(authUser.uid);
    await userRef.set(
      {
        balance: FieldValue.increment(n),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return json({ ok: true });
  } catch (e) {
    const status = /token|bearer|auth/i.test(e?.message || "") ? 401 : 400;
    return err(e.message || "Recharge failed", status);
  }
}
