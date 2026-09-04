import { getFirestore } from './_firebase.js';

// Fusion de driver-status.js + driver-deliver.js + driver-orders.js dans un
// seul fichier, pour rester sous la limite de 12 fonctions serverless du plan
// Vercel Hobby. Comportement strictement identique à avant, juste regroupé.
//
//   GET  /api/driver?driverId=...                          -> livraisons en cours (ex driver-orders.js)
//   POST /api/driver  { action: 'status', driverId, status }        -> dispo/pause (ex driver-status.js)
//   POST /api/driver  { action: 'deliver', driverId, orderId }      -> marquer livrée (ex driver-deliver.js)

const isToday = iso => iso && new Date(iso).toDateString() === new Date().toDateString();

async function getOrders(req, res) {
  const { driverId } = req.query;
  if (!driverId) return res.status(400).json({ error: 'driverId manquant' });

  try {
    const db = getFirestore();
    const activeSnap = await db.collection('orders')
      .where('driverId', '==', driverId).where('status', '==', 'delivering').get();
    const doneSnap = await db.collection('orders')
      .where('driverId', '==', driverId).where('status', '==', 'delivered').get();

    const active = activeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const doneToday = doneSnap.docs.map(d => d.data()).filter(o => isToday(o.deliveredAt)).length;

    return res.status(200).json({ orders: active, doneToday });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Erreur' });
  }
}

// Endpoint public volontairement restreint : un livreur peut seulement se mettre
// dispo <-> pause. Il ne peut jamais se déclarer lui-même "livraison" ni modifier
// un autre livreur que celui qu'il pilote — ces transitions restent décidées côté
// serveur (voir api/orders/[id].js) pour ne jamais faire confiance au client.
async function postStatus(req, res, body) {
  const { driverId, status } = body;
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

async function postDeliver(req, res, body) {
  const { driverId, orderId } = body;
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

export default async function handler(req, res) {
  if (req.method === 'GET') return getOrders(req, res);

  if (req.method === 'POST') {
    const body = req.body || {};
    if (body.action === 'status') return postStatus(req, res, body);
    if (body.action === 'deliver') return postDeliver(req, res, body);
    return res.status(400).json({ error: 'action invalide' });
  }

  return res.status(405).end();
}
