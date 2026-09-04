import Stripe from 'stripe';
import { getFirestore } from './_firebase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe a besoin du corps brut (non parsé) de la requête pour vérifier la signature.
export const config = {
  api: { bodyParser: false },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Signature webhook invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const db = getFirestore();
      await db.collection('orders').doc(session.id).set({
        orderId: session.metadata?.orderId || null,
        firstName: session.metadata?.firstName || '',
        phone: session.metadata?.phone || '',
        address: session.metadata?.address || '',
        zip: session.metadata?.zip || '',
        city: session.metadata?.city || '',
        note: session.metadata?.note || '',
        total: (session.amount_total || 0) / 100,
        currency: session.currency,
        paymentStatus: session.payment_status,
        status: 'received', // received -> preparing -> delivering -> delivered
        stripeSessionId: session.id,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Erreur écriture Firestore:', err);
      // On renvoie quand même 200 à Stripe pour éviter des retries en boucle
      // une fois l'événement reçu ; l'erreur est loguée pour investigation.
    }
  }

  res.status(200).json({ received: true });
}
