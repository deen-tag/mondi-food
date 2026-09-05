import Stripe from 'stripe';
import { priceCart } from './_menu.js';
import { getFirestore } from './_firebase.js';
import { checkPromoCode } from './_promo.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { cart, customer, promoCode } = req.body || {};
    const { items, subtotal, delivery, total } = priceCart(cart);

    let discounts;
    let appliedPromo = null;
    if (promoCode) {
      // Revalidé côté serveur, jamais confiance dans une réduction affichée plus tôt.
      const db = getFirestore();
      const result = await checkPromoCode(db, promoCode, subtotal);
      appliedPromo = result.code;
      // Stripe n'accepte pas de ligne à prix négatif : la réduction passe par un
      // "coupon" créé à la volée (montant fixe en centimes), appliqué à la session.
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(result.discount * 100),
        currency: 'eur',
        duration: 'once',
        name: `Code ${appliedPromo}`,
      });
      discounts = [{ coupon: coupon.id }];
    }

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
      discounts,
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
        promoCode: appliedPromo || '',
      },
    });

    return res.status(200).json({ url: session.url, id: session.id, orderId, total });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'Erreur lors de la création du paiement' });
  }
}
