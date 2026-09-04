import { getFirestore } from './_firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { driverId, orderId } = req.body || {};
  if (!driverId || !orderId) return res.status(400).json({ error: 'Requête invalide' });

  try {
    const db = getFirestore();
    const ref = db.collection('orders').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Commande introuvable' });
    const o = snap.data();
    // On ne fait jamais confiance au client : on vérifie côté serveur que cette
    // commande est bien assignée à ce livreur et encore en cours de livraison.
    if (o.driverId !== driverId || o.status !== 'delivering') {
      return res.status(409).json({ error: 'Cette commande ne peut pas être marquée livrée' });
    }
    const patch = { status: 'delivered', deliveredAt: new Date().toISOString() };
    if (o.paymentStatus === 'attente') patch.paymentStatus = 'paye';
    await ref.update(patch);
    await db.collection('drivers').doc(driverId).update({ status: 'dispo' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Erreur' });
  }
}
