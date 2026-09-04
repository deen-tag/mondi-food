import { getFirestore } from './_firebase.js';
import { requireAdmin } from './_admin-auth.js';
import { priceCart } from './_menu.js';

export default async function handler(req, res) {
  const db = getFirestore();

  if (req.method === 'GET') {
    // Réservé à l'admin : toutes les commandes, triées des plus récentes aux plus anciennes.
    if (!requireAdmin(req, res)) return;
    const snap = await db.collection('orders').orderBy('createdAt', 'desc').limit(300).get();
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ orders });
  }

  if (req.method === 'POST') {
    // Public : uniquement pour le paiement "à la livraison" (le paiement en ligne
    // passe par Stripe puis le webhook, jamais par cette route).
    try {
      const { cart, customer } = req.body || {};
      const { items, total } = priceCart(cart);
      const orderId = 'DK-' + Math.floor(1000 + Math.random() * 9000);
      const doc = {
        orderId,
        firstName: String(customer?.firstName || '').slice(0, 80),
        phone: String(customer?.phone || '').slice(0, 30),
        address: String(customer?.address || '').slice(0, 200),
        zip: String(customer?.zip || '').slice(0, 12),
        city: String(customer?.city || '').slice(0, 80),
        note: String(customer?.note || '').slice(0, 300),
        items: items.map((it) => ({ name: it.name, qty: it.qty, price: it.unitPrice, opts: it.opts })),
        total,
        currency: 'eur',
        paymentMethod: 'delivery',
        paymentStatus: 'attente', // encaissé par le livreur à la remise
        status: 'received', // received -> preparing -> delivering -> delivered -> cancelled
        driverId: null,
        prepEstimate: null,
        readyAt: null,
        deliveryStartedAt: null,
        deliveredAt: null,
        cancelReason: null,
        createdAt: new Date().toISOString(),
      };
      const ref = await db.collection('orders').add(doc);
      return res.status(200).json({ id: ref.id, orderId, total });
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: err.message || 'Commande invalide' });
    }
  }

  return res.status(405).end();
}
