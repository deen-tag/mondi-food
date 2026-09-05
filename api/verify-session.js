import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { session_id } = req.query || {};
  if (!session_id) return res.status(400).json({ error: 'session_id manquant' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(200).json({ paid: false });
    }
    return res.status(200).json({
      paid: true,
      orderId: session.metadata?.orderId || null,
      firstName: session.metadata?.firstName || '',
      total: (session.amount_total || 0) / 100,
      discount: session.total_details?.amount_discount ? session.total_details.amount_discount / 100 : 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'Session introuvable' });
  }
}
