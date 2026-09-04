// Catalogue côté serveur — copie volontairement séparée du frontend (src/main.js)
// pour ne jamais faire confiance aux prix envoyés par le client.
// Si tu modifies un prix dans src/main.js, pense à le répercuter ici.

export const MENU = [
  { id: 'm1', name: 'L’Original', price: 12.90 },
  { id: 'm2', name: 'Poulet Crémeux', price: 13.90 },
  { id: 'm3', name: 'Diavolo', price: 13.50 },
  { id: 'm4', name: 'Végétarien', price: 12.90 },
  { id: 'p1', name: 'Margherita', price: 11.90 },
  { id: 'p2', name: 'Pepperoni', price: 12.90 },
  { id: 'p3', name: '4 Fromages', price: 12.90 },
  { id: 'p4', name: 'Légumes Rôtis', price: 12.50 },
  { id: 'p5', name: 'Diavolo', price: 13.50 },
];

export const OPTION_PRICES = {
  'Fromage supplémentaire': 1.00,
  'Base épicée': 0.50,
};

export const DELIVERY_FEE = 2.50;
export const FREE_DELIVERY_THRESHOLD = 25;

// Recalcule un panier envoyé par le client à partir du catalogue serveur.
// Ignore tout prix/quantité fourni par le client au-delà de id/opts/qty.
export function priceCart(clientCart) {
  if (!Array.isArray(clientCart) || !clientCart.length) {
    throw new Error('Panier vide ou invalide');
  }
  const items = clientCart.map((line) => {
    const product = MENU.find((p) => p.id === line.id);
    if (!product) throw new Error(`Produit inconnu: ${line.id}`);
    const opts = Array.isArray(line.opts) ? line.opts.filter((o) => o in OPTION_PRICES) : [];
    const qty = Math.max(1, Math.min(20, parseInt(line.qty, 10) || 1));
    const extra = opts.reduce((a, o) => a + OPTION_PRICES[o], 0);
    const unitPrice = Math.round((product.price + extra) * 100) / 100;
    return { name: product.name, opts, unitPrice, qty };
  });
  const subtotal = Math.round(items.reduce((a, x) => a + x.unitPrice * x.qty, 0) * 100) / 100;
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = Math.round((subtotal + delivery) * 100) / 100;
  return { items, subtotal, delivery, total };
}
