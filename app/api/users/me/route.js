import { verifyToken, adminDb } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req) {
  try {
    const authUser = await verifyToken(req);
    const userRef = adminDb.collection("users").doc(authUser.uid);
    let snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set(
        {
          displayName: authUser.name || authUser.email?.split("@")[0] || "User",
          photoURL: authUser.picture || null,
          balance: 1000,
          role: "admin",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      snap = await userRef.get();
    }

    return json({ id: snap.id, ...snap.data() });
  } catch (e) {
    return err(e.message || "Unauthorized", 401);
  }
}
