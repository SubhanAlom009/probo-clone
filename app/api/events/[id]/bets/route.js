import { placeOrder } from "@/lib/db";
import { verifyToken, adminDb as db } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";

export async function GET(req, context) {
  const params = await context.params;
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const q = db.collection("bets").where("eventId", "==", params.id);
  const snap = await q.get();

  if (userId) {
    rows = rows.filter((b) => b.yesUserId === userId || b.noUserId === userId);
  }

  rows.sort(
    (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
  );
  return json(rows);
}

export async function POST(req, context) {
  const params = await context.params;
  try {
    const authUser = await verifyToken(req);
    const { side, price, quantity } = await req.json();

    if (!side || price === undefined || quantity === undefined) {
      return err("side, price, quantity required", 400);
    }

    await placeOrder({
      eventId: params.id,
      userId: authUser.uid,
      side,
      price: Number(price),
      quantity: Number(quantity),
    });
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 400);
  }
}
