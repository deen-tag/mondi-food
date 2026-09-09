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
  { id: 'b1', name: 'Coca-Cola', price: 2.00 },
  { id: 'b2', name: 'Coca-Cola Zéro', price: 2.00 },
  { id: 'b3', name: 'Coca-Cola Cherry', price: 2.00 },
  { id: 'b4', name: 'Fanta Orange', price: 2.00 },
  { id: 'b5', name: 'Sprite', price: 2.00 },
  { id: 'b6', name: 'Oasis Tropical', price: 2.00 },
  { id: 'b7', name: 'Oasis Pomme Cassis Framboise', price: 2.00 },
  { id: 'b8', name: 'Ice Tea Pêche', price: 2.00 },
  { id: 'b9', name: 'Orangina', price: 2.00 },
  { id: 'b10', name: 'Schweppes Agrumes', price: 2.00 },
  { id: 'b11', name: 'Perrier', price: 2.00 },
  { id: 'b12', name: 'Evian', price: 2.00 },
  { id: 'd1', name: 'Tiramisu Classique', price: 5.90 },
  { id: 'd2', name: 'Tiramisu Nutella', price: 6.50 },
  { id: 'd3', name: 'Fondant au Chocolat', price: 5.50 },
  { id: 'd4', name: 'Cheesecake', price: 5.90 },
  { id: 'd5', name: 'Cookie 3 Chocolats', price: 3.90 },
  { id: 'd6', name: 'Cookie Nutella', price: 4.50 },
  { id: 'd7', name: 'Pizza Nutella', price: 7.90 },
  { id: 'd8', name: 'Pizza Nutella & Kinder', price: 8.90 },
  // Mondi Night — vendredi & samedi, 23h → 5h (voir night.html / src/night.js)
  { id: 'nb1', name: 'Burger Le Classique', price: 11.90 },
  { id: 'nb2', name: 'Burger Le Cheese', price: 12.90 },
  { id: 'nb3', name: 'Burger Le Bacon', price: 13.90 },
  { id: 'nb4', name: 'Burger Le Chicken', price: 13.90 },
  { id: 'nb5', name: 'Burger Le Montagnard', price: 14.90 },
  { id: 'nb6', name: 'Burger Le Spécial Mondi', price: 15.90 },
  { id: 'np1', name: 'Penne Bolognaise', price: 11.90 },
  { id: 'np2', name: 'Penne Carbonara', price: 12.90 },
  { id: 'np3', name: 'Penne Poulet Crème', price: 13.90 },
  { id: 'np4', name: 'Penne 4 Fromages', price: 13.90 },
  { id: 'np5', name: 'Penne Épicées', price: 13.90 },
  { id: 'ng1', name: 'Galette La Complète', price: 11.90 },
  { id: 'ng2', name: 'Galette Jambon Fromage', price: 10.90 },
  { id: 'ng3', name: 'Galette Poulet Fromage', price: 12.90 },
  { id: 'ng4', name: 'Galette Poulet Curry', price: 13.90 },
  { id: 'ng5', name: 'Galette 3 Fromages', price: 12.90 },
];

export const OPTION_PRICES = {
  'Fromage supplémentaire': 1.00,
  'Base épicée': 0.50,
};

// Catalogue du configurateur "Compose ta recette" — copie serveur de src/main.js
// (CUSTOM_CONFIG). Les prix envoyés par le client ne sont JAMAIS utilisés : on
// ne retient que les identifiants choisis (baseId/sauceId/ingredientIds) et on
// recalcule tout ici.
export const CUSTOM_MENU = {
  pizza: {
    label: 'Pizza',
    basePrice: 8.90,
    bases: [
      { id: 'fine', name: 'Pâte fine', extra: 0 },
      { id: 'epaisse', name: 'Pâte épaisse', extra: 0 },
      { id: 'sans-gluten', name: 'Pâte sans gluten', extra: 2 },
    ],
    sauces: [
      { id: 'tomate', name: 'Sauce tomate', extra: 0 },
      { id: 'creme', name: 'Crème fraîche', extra: 0 },
      { id: 'sans-sauce', name: 'Sans sauce', extra: 0 },
    ],
    ingredients: [
      { id: 'mozzarella', name: 'Mozzarella', price: 1.5 },
      { id: 'chevre', name: 'Chèvre', price: 1.8 },
      { id: 'gorgonzola', name: 'Gorgonzola', price: 1.8 },
      { id: 'jambon', name: 'Jambon', price: 1.8 },
      { id: 'chorizo', name: 'Chorizo', price: 1.8 },
      { id: 'poulet', name: 'Poulet rôti', price: 2 },
      { id: 'champignons', name: 'Champignons', price: 1 },
      { id: 'poivrons', name: 'Poivrons', price: 1 },
      { id: 'oignons', name: 'Oignons rouges', price: 1 },
      { id: 'olives', name: 'Olives', price: 1 },
      { id: 'roquette', name: 'Roquette', price: 1 },
      { id: 'piment', name: 'Piment frais', price: 0.8 },
    ],
  },
  pannuezo: {
    label: 'Pannuezo',
    basePrice: 9.90,
    bases: [
      { id: 'classique', name: 'Pain classique', extra: 0 },
      { id: 'complet', name: 'Pain complet', extra: 0.8 },
    ],
    sauces: [
      { id: 'tomate', name: 'Sauce tomate', extra: 0 },
      { id: 'creme', name: 'Crème fraîche', extra: 0 },
      { id: 'epicee', name: 'Sauce épicée', extra: 0 },
      { id: 'sans-sauce', name: 'Sans sauce', extra: 0 },
    ],
    ingredients: [
      { id: 'mozzarella', name: 'Mozzarella', price: 1.5 },
      { id: 'jambon', name: 'Jambon fumé', price: 1.8 },
      { id: 'poulet', name: 'Poulet rôti', price: 2 },
      { id: 'chorizo', name: 'Chorizo', price: 1.8 },
      { id: 'champignons', name: 'Champignons', price: 1 },
      { id: 'oignons', name: 'Oignons caramélisés', price: 1 },
      { id: 'poivrons', name: 'Poivrons', price: 1 },
      { id: 'courgettes', name: 'Courgettes grillées', price: 1 },
      { id: 'roquette', name: 'Roquette', price: 1 },
      { id: 'piment', name: 'Piment', price: 0.8 },
    ],
  },
};

// Recalcule le prix d'une ligne "recette personnalisée" à partir des seuls
// identifiants envoyés par le client (line.id = 'custom-pizza'|'custom-pannuezo',
// line.custom = { baseId, sauceId, ingredientIds }).
function priceCustomLine(line) {
  const type = line.id === 'custom-pizza' ? 'pizza' : 'pannuezo';
  const cfg = CUSTOM_MENU[type];
  const custom = line.custom || {};
  const base = cfg.bases.find((b) => b.id === custom.baseId);
  const sauce = cfg.sauces.find((s) => s.id === custom.sauceId);
  if (!base || !sauce) throw new Error('Recette personnalisée invalide');
  const ingredientIds = Array.isArray(custom.ingredientIds) ? custom.ingredientIds : [];
  const ingredients = ingredientIds
    .map((id) => cfg.ingredients.find((i) => i.id === id))
    .filter(Boolean);
  const extra = base.extra + sauce.extra + ingredients.reduce((a, i) => a + i.price, 0);
  const unitPrice = Math.round((cfg.basePrice + extra) * 100) / 100;
  const opts = [base.name, sauce.name, ...ingredients.map((i) => i.name)];
  const qty = Math.max(1, Math.min(20, parseInt(line.qty, 10) || 1));
  return { name: `${cfg.label} personnalisée`, opts, unitPrice, qty };
}

export const DELIVERY_FEE = 2.50;
export const FREE_DELIVERY_THRESHOLD = 25;

// Recalcule un panier envoyé par le client à partir du catalogue serveur.
// Ignore tout prix/quantité fourni par le client au-delà de id/opts/qty.
export function priceCart(clientCart) {
  if (!Array.isArray(clientCart) || !clientCart.length) {
    throw new Error('Panier vide ou invalide');
  }
  const items = clientCart.map((line) => {
    if (line.id === 'custom-pizza' || line.id === 'custom-pannuezo') {
      return priceCustomLine(line);
    }
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
