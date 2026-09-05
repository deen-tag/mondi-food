import { getFirestore } from './_firebase.js';
import { AggregateField } from 'firebase-admin/firestore';
import { requireAdmin } from './_admin-auth.js';
import { priceCart } from './_menu.js';
import { sendPushToAll } from './_push.js';

export default async function handler(req, res) {
  const db = getFirestore();

  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;

    // Mode "stats" : totaux depuis toujours (nombre de commandes + chiffre d'affaires).
    // Utilisé dans l'onglet Historique, chargé une seule fois (pas de polling), via
    // une requête d'agrégation Firestore qui ne lit pas chaque commande une par une.
    if (req.query.stats) {
      const [countAgg, sumAgg] = await Promise.all([
        db.collection('orders').count().get(),
        db.collection('orders').aggregate({ totalRevenue: AggregateField.sum('total') }).get(),
      ]);
      return res.status(200).json({
        totalOrders: countAgg.data().count,
        totalRevenue: sumAgg.data().totalRevenue || 0,
      });
    }

    // Mode "ping" : utilisé par le polling toutes les 15s côté admin. Ne renvoie
    // qu'un compteur (requête d'agrégation Firestore : ~1 lecture peu importe le
    // nombre de commandes) au lieu de la liste complète. Le dashboard ne va chercher
    // la liste complète (coûteuse) que quand ce compteur change, càd qu'il se passe
    // réellement quelque chose (nouvelle commande, livraison terminée, etc.).
    if (req.query.ping) {
      const agg = await db.collection('orders')
        .where('status', 'in', ['received', 'preparing', 'delivering'])
        .count()
        .get();
      return res.status(200).json({ active: agg.data().count });
    }

    // Sinon : commandes des 7 derniers jours (suffisant pour le dashboard
    // et les stats "aujourd'hui / hier / cette semaine"), triées des plus récentes aux
    // plus anciennes. On borne par date en plus du limit pour éviter que la requête
    // ne lise de plus en plus de documents au fil du temps (coût Firestore).
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
    const snap = await db.collection('orders')
      .where('createdAt', '>=', cutoff)
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
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
      await sendPushToAll({
        title: 'Nouvelle commande',
        body: `#${orderId} · ${total.toFixed(2).replace('.', ',')} €`,
      }).catch((err) => console.error('Push ignoré (ne bloque pas la commande):', err.message));
      return res.status(200).json({ id: ref.id, orderId, total });
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: err.message || 'Commande invalide' });
    }
  }

  return res.status(405).end();
}
