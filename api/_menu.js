// Catalogue côté serveur — désormais lu depuis Firestore (api/_menu-store.js), plus
// jamais codé en dur ici. On ne fait toujours confiance à AUCUN prix envoyé par le
// client : priceCart recalcule tout à partir de ce que la base contient.

import { getCatalog } from './_menu-store.js';

// Recalcule le prix d'une ligne "recette personnalisée" à partir des seuls
// identifiants envoyés par le client (line.id = 'custom-pizza'|'custom-pannuezo',
// line.custom = { baseId, sauceId, ingredientIds }).
function priceCustomLine(line, configurators) {
  const type = line.id === 'custom-pizza' ? 'pizza' : 'pannuezo';
  const cfg = configurators.find((c) => c.id === type);
  if (!cfg || cfg.active === false) throw new Error('Recette personnalisée indisponible');
  const custom = line.custom || {};
  const base = (cfg.bases || []).find((b) => b.id === custom.baseId);
  const sauce = (cfg.sauces || []).find((s) => s.id === custom.sauceId);
  if (!base || !sauce) throw new Error('Recette personnalisée invalide');
  const ingredientIds = Array.isArray(custom.ingredientIds) ? custom.ingredientIds : [];
  const ingredients = ingredientIds
    .map((id) => (cfg.ingredients || []).find((i) => i.id === id))
    .filter(Boolean);
  const extra = base.extra + sauce.extra + ingredients.reduce((a, i) => a + i.price, 0);
  const unitPrice = Math.round((cfg.basePrice + extra) * 100) / 100;
  const opts = [base.name, sauce.name, ...ingredients.map((i) => i.name)];
  const qty = Math.max(1, Math.min(20, parseInt(line.qty, 10) || 1));
  return { name: `${cfg.label} personnalisée`, opts, unitPrice, qty };
}

// Recalcule un panier envoyé par le client à partir du catalogue serveur (Firestore).
// Ignore tout prix/quantité fourni par le client au-delà de id/opts/qty.
export async function priceCart(clientCart) {
  if (!Array.isArray(clientCart) || !clientCart.length) {
    throw new Error('Panier vide ou invalide');
  }
  const { products, configurators, settings } = await getCatalog();
  const optionPrices = settings.optionPrices || {};
  const items = clientCart.map((line) => {
    if (line.id === 'custom-pizza' || line.id === 'custom-pannuezo') {
      return priceCustomLine(line, configurators);
    }
    const product = products.find((p) => p.id === line.id);
    if (!product || product.active === false) throw new Error(`Produit inconnu: ${line.id}`);
    const opts = Array.isArray(line.opts) ? line.opts.filter((o) => o in optionPrices) : [];
    const qty = Math.max(1, Math.min(20, parseInt(line.qty, 10) || 1));
    const extra = opts.reduce((a, o) => a + optionPrices[o], 0);
    const unitPrice = Math.round((product.price + extra) * 100) / 100;
    return { name: product.name, opts, unitPrice, qty };
  });
  const subtotal = Math.round(items.reduce((a, x) => a + x.unitPrice * x.qty, 0) * 100) / 100;
  const deliveryFee = settings.deliveryFee ?? 2.5;
  const freeThreshold = settings.freeDeliveryThreshold ?? 25;
  const delivery = subtotal >= freeThreshold ? 0 : deliveryFee;
  const total = Math.round((subtotal + delivery) * 100) / 100;
  return { items, subtotal, delivery, total };
}
