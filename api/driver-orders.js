import { getFirestore } from './_firebase.js';

const isToday = iso => iso && new Date(iso).toDateString() === new Date().toDateString();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
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
