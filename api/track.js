import { getFirestore } from './_firebase.js';

// Endpoint public (le client suit sa commande sans compte ni connexion).
// Volontairement minimal : pas d'adresse, pas de téléphone, pas de montant détaillé —
// seulement de quoi afficher la timeline de suivi.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { orderId } = req.query;
  if (!orderId) return res.status(400).json({ error: 'orderId manquant' });

  try {
    const db = getFirestore();
    const snap = await db.collection('orders').where('orderId', '==', orderId).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Commande introuvable' });
    const o = snap.docs[0].data();
    let driverName = null;
    if (o.driverId) {
      const dDoc = await db.collection('drivers').doc(o.driverId).get();
      driverName = dDoc.exists ? dDoc.data().name : null;
    }
    return res.status(200).json({
      orderId: o.orderId,
      status: o.status,
      cancelReason: o.cancelReason || null,
      readyAt: o.readyAt || null,
      driverName,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Erreur de suivi' });
  }
}
