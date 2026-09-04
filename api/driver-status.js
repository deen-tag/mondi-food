import { getFirestore } from './_firebase.js';

// Endpoint public volontairement restreint : un livreur peut seulement se mettre
// dispo <-> pause. Il ne peut jamais se déclarer lui-même "livraison" ni modifier
// un autre livreur que celui qu'il pilote — ces transitions restent décidées côté
// serveur (voir api/orders/[id].js) pour ne jamais faire confiance au client.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { driverId, status } = req.body || {};
  if (!driverId || !['dispo', 'pause'].includes(status)) {
    return res.status(400).json({ error: 'Requête invalide' });
  }
  try {
    const db = getFirestore();
    const ref = db.collection('drivers').doc(driverId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Livreur introuvable' });
    if (snap.data().status === 'livraison') {
      return res.status(409).json({ error: 'Impossible : une livraison est en cours' });
    }
    await ref.update({ status });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Erreur' });
  }
}
