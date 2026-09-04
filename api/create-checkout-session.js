import Stripe from 'stripe';
import { priceCart } from './_menu.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { cart, customer } = req.body || {};
    const { items, delivery, total } = priceCart(cart);

    const line_items = items.map((it) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: it.opts.length ? `${it.name} (${it.opts.join(', ')})` : it.name,
        },
        unit_amount: Math.round(it.unitPrice * 100),
      },
      quantity: it.qty,
    }));

    if (delivery > 0) {
      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Livraison' },
          unit_amount: Math.round(delivery * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const orderId = 'DK-' + Math.floor(1000 + Math.random() * 9000);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}#confirmation`,
      cancel_url: `${origin}/?#checkout`,
      customer_email: customer?.email || undefined,
      metadata: {
        orderId,
        firstName: customer?.firstName || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        zip: customer?.zip || '',
        city: customer?.city || '',
        note: customer?.note || '',
      },
    });

    return res.status(200).json({ url: session.url, id: session.id, orderId, total });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'Erreur lors de la création du paiement' });
  }
}
