import { getFirestore } from '../_firebase.js';
import { requireAdmin } from '../_admin-auth.js';

// Liste blanche des champs modifiables — jamais accepter un patch arbitraire du client.
const ALLOWED = [
  'status', 'prepEstimate', 'readyAt', 'driverId',
  'deliveryStartedAt', 'deliveredAt', 'cancelReason', 'paymentStatus',
];

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end();
  if (!requireAdmin(req, res)) return;

  const { id } = req.query;
  const body = req.body || {};
  const patch = {};
  for (const k of ALLOWED) if (k in body) patch[k] = body[k];
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Rien à mettre à jour' });

  try {
    const db = getFirestore();
    const ref = db.collection('orders').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Commande introuvable' });
    const before = snap.data();

    await ref.update(patch);

    // Effets de bord côté serveur — jamais confiés au client : on ne fait jamais
    // confiance à un livreur/statut envoyé séparément, on dérive tout de la transition.
    if (patch.driverId && patch.driverId !== before.driverId) {
      await db.collection('drivers').doc(patch.driverId).update({ status: 'livraison' });
    }
    const justFinished = patch.status === 'delivered' || patch.status === 'cancelled';
    const driverToFree = patch.driverId || before.driverId;
    if (justFinished && driverToFree) {
      await db.collection('drivers').doc(driverToFree).update({ status: 'dispo' }).catch(() => {});
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Mise à jour impossible' });
  }
}

