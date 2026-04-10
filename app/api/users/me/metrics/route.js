import { verifyToken, adminDb } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";

export async function GET(req) {
  try {
    const authUser = await verifyToken(req);
    const uid = authUser.uid;

    const [yesSnap, noSnap] = await Promise.all([
      adminDb.collection("bets").where("yesUserId", "==", uid).get(),
      adminDb.collection("bets").where("noUserId", "==", uid).get(),
    ]);

    const byId = new Map();
    yesSnap.forEach((d) => byId.set(d.id, { id: d.id, ...d.data() }));
    noSnap.forEach((d) => byId.set(d.id, { id: d.id, ...d.data() }));
    const allBets = Array.from(byId.values());

    let totalStake = 0;
    let resolved = 0;
    let wins = 0;
    let returns = 0;

    for (const b of allBets) {
      const yesLocked = Number(b.yesLocked || 0);
      const noLocked = Number(b.noLocked || 0);

      let userLocked = 0;
      if (b.yesUserId === uid) userLocked = yesLocked;
      if (b.noUserId === uid) userLocked = noLocked;
      totalStake += userLocked;

      if (b.status === "settled") {
        resolved += 1;
        const isWinner =
          (b.winner === "yes" && b.yesUserId === uid) ||
          (b.winner === "no" && b.noUserId === uid);
        if (isWinner) {
          wins += 1;
          returns += yesLocked + noLocked;
        }
      }
    }

    const winRate = resolved ? wins / resolved : 0;
    return json({
      totalStake,
      resolvedBets: resolved,
      wins,
      winRate,
      totalReturn: returns,
      profit: returns - totalStake,
    });
  } catch (e) {
    return err(e.message || "Failed to load metrics", 400);
  }
}
