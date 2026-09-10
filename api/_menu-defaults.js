// Contenu par défaut du catalogue : sert (1) de source pour le script de seed
// Firestore (scripts/seed-menu.js) et (2) de filet de sécurité si Firestore est
// vide ou injoignable, pour que le site ne casse jamais complètement.
// C'est une reprise exacte de l'ancien contenu figé de src/main.js, src/night.js,
// src/shared-products.js et api/_menu.js — désormais la SEULE copie en dur qui reste,
// tout le reste (front + admin) passe par Firestore via api/menu.js.

export const DEFAULT_CATEGORIES = [
  { slug: 'pannuezo', label: 'Pannuezo', sites: ['main'], kind: 'products', order: 10, active: true },
  { slug: 'pizza', label: 'Pizza', sites: ['main'], kind: 'products', order: 20, active: true },
  { slug: 'burger', label: 'Burgers', sites: ['night'], kind: 'products', order: 10, active: true },
  { slug: 'pate', label: 'Pâtes', sites: ['night'], kind: 'products', order: 20, active: true },
  { slug: 'galette', label: 'Galettes', sites: ['night'], kind: 'products', order: 30, active: true },
  { slug: 'boisson', label: 'Boissons', sites: ['main', 'night'], kind: 'products', order: 40, active: true },
  { slug: 'dessert', label: 'Desserts', sites: ['main', 'night'], kind: 'products', order: 50, active: true },
  { slug: 'compose-pizza', label: 'Compose ta pizza', sites: ['main'], kind: 'configurator', order: 60, active: true },
  { slug: 'compose-pannuezo', label: 'Compose ton pannuezo', sites: ['main'], kind: 'configurator', order: 70, active: true },
];

export const DEFAULT_PRODUCTS = [
  // Pannuezo (site principal)
  { id: 'm1', categoryId: 'pannuezo', name: 'L’Original', price: 12.90, desc: 'Sauce tomate maison, mozzarella fondante, jambon fumé, origan', img: '/images/pannuezo-original.png', badge: 'LE PLUS POPULAIRE', tag: 'Classiques', popular: true, order: 10 },
  { id: 'm2', categoryId: 'pannuezo', name: 'Poulet Crémeux', price: 13.90, desc: 'Crème fraîche, mozzarella, poulet rôti, champignons, oignons caramélisés', img: '/images/pannuezo-poulet.png', tag: 'Gourmands', order: 20 },
  { id: 'm3', categoryId: 'pannuezo', name: 'Diavolo', price: 13.50, desc: 'Sauce tomate épicée, mozzarella, chorizo, poivrons, piment', img: '/images/pannuezo-diavolo.png', hot: true, tag: 'Épicés', order: 30 },
  { id: 'm4', categoryId: 'pannuezo', name: 'Végétarien', price: 12.90, desc: 'Sauce tomate, mozzarella, courgettes grillées, poivrons, champignons, roquette', img: '/images/pannuezo-vege.png', veg: true, tag: 'Végétariens', order: 40 },
  // Pizza (site principal)
  { id: 'p1', categoryId: 'pizza', name: 'Margherita', price: 11.90, desc: 'Sauce tomate maison, mozzarella fior di latte, basilic frais, huile d’olive', img: '/images/margherita.png', badge: 'LA PLUS POPULAIRE', tag: 'Classiques', popular: true, order: 10 },
  { id: 'p2', categoryId: 'pizza', name: 'Pepperoni', price: 12.90, desc: 'Sauce tomate, mozzarella, pepperoni, origan', img: '/images/pepperoni.png', tag: 'Classiques', order: 20 },
  { id: 'p3', categoryId: 'pizza', name: '4 Fromages', price: 12.90, desc: 'Mozzarella, gorgonzola, chèvre, parmesan, emmental', img: '/images/four-cheese.png', tag: 'Gourmandes', order: 30 },
  { id: 'p4', categoryId: 'pizza', name: 'Légumes Rôtis', price: 12.50, desc: 'Sauce tomate, mozzarella, poivrons, courgettes, aubergines, oignons rouges', img: '/images/veggie.png', veg: true, tag: 'Végétariennes', order: 40 },
  { id: 'p5', categoryId: 'pizza', name: 'Diavolo', price: 13.50, desc: 'Sauce tomate épicée, mozzarella, chorizo, poivrons, piment', img: '/images/diavolo.png', hot: true, tag: 'Épicées', order: 50 },
  // Burgers (Mondi Night)
  { id: 'nb1', categoryId: 'burger', name: 'Le Classique', price: 11.90, desc: 'Steak haché, salade, tomate, oignons, sauce burger maison', img: '/images/night/burger-classique.jpg', order: 10 },
  { id: 'nb2', categoryId: 'burger', name: 'Le Cheese', price: 12.90, desc: 'Steak haché, cheddar fondant, salade, tomate, sauce burger maison', img: '/images/night/burger-cheese.jpg', order: 20 },
  { id: 'nb3', categoryId: 'burger', name: 'Le Bacon', price: 13.90, desc: 'Steak haché, bacon grillé, cheddar, oignons caramélisés, sauce fumée', img: '/images/night/burger-bacon.jpg', order: 30 },
  { id: 'nb4', categoryId: 'burger', name: 'Le Chicken', price: 13.90, desc: 'Poulet croustillant, salade, tomate, sauce burger maison', img: '/images/night/burger-chicken.jpg', order: 40 },
  { id: 'nb5', categoryId: 'burger', name: 'Le Montagnard', price: 14.90, desc: 'Steak haché, reblochon fondant, oignons caramélisés, sauce montagnarde', img: '/images/night/burger-montagnard.jpg', order: 50 },
  { id: 'nb6', categoryId: 'burger', name: 'Le Spécial Mondi', price: 15.90, desc: 'Double steak, cheddar, bacon, oignons frits, sauce signature Mondi', img: '/images/night/burger-special-mondi.jpg', badge: 'SIGNATURE', order: 60 },
  // Pâtes (Mondi Night)
  { id: 'np1', categoryId: 'pate', name: 'Penne Bolognaise', price: 11.90, desc: 'Sauce tomate mijotée, viande hachée, parmesan', img: '/images/night/pates-bolognaise.jpg', order: 10 },
  { id: 'np2', categoryId: 'pate', name: 'Penne Carbonara', price: 12.90, desc: 'Crème, lardons, parmesan, poivre', img: '/images/night/pates-carbonara.jpg', order: 20 },
  { id: 'np3', categoryId: 'pate', name: 'Penne Poulet Crème', price: 13.90, desc: 'Poulet rôti, crème, champignons, parmesan', img: '/images/night/pates-poulet-creme.jpg', order: 30 },
  { id: 'np4', categoryId: 'pate', name: 'Penne 4 Fromages', price: 13.90, desc: 'Mozzarella, gorgonzola, chèvre, parmesan', img: '/images/night/pates-4-fromages.jpg', order: 40 },
  { id: 'np5', categoryId: 'pate', name: 'Penne Épicées', price: 13.90, desc: 'Sauce tomate relevée, piment, chorizo', img: '/images/night/pates-epicees.jpg', hot: true, order: 50 },
  // Galettes (Mondi Night)
  { id: 'ng1', categoryId: 'galette', name: 'La Complète', price: 11.90, desc: 'Jambon, œuf, fromage, roulée dans une galette de sarrasin', img: '/images/night/galette-complete.jpg', order: 10 },
  { id: 'ng2', categoryId: 'galette', name: 'Jambon Fromage', price: 10.90, desc: 'Jambon, emmental fondant, galette de sarrasin roulée', img: '/images/night/galette-jambon-fromage.jpg', order: 20 },
  { id: 'ng3', categoryId: 'galette', name: 'Poulet Fromage', price: 12.90, desc: 'Poulet rôti, emmental fondant, galette de sarrasin roulée', img: '/images/night/galette-poulet-fromage.jpg', order: 30 },
  { id: 'ng4', categoryId: 'galette', name: 'Poulet Curry', price: 13.90, desc: 'Poulet, sauce curry, oignons, galette de sarrasin roulée', img: '/images/night/galette-poulet-curry.jpg', order: 40 },
  { id: 'ng5', categoryId: 'galette', name: '3 Fromages', price: 12.90, desc: 'Emmental, chèvre, gorgonzola, galette de sarrasin roulée', img: '/images/night/galette-3-fromages.jpg', order: 50 },
  // Boissons (communes aux deux sites)
  { id: 'b1', categoryId: 'boisson', name: 'Coca-Cola', price: 2.00, desc: '33 cl', img: '/images/boissons/coca-cola.png', order: 10 },
  { id: 'b2', categoryId: 'boisson', name: 'Coca-Cola Zéro', price: 2.00, desc: '33 cl', img: '/images/boissons/coca-cola-zero.png', order: 20 },
  { id: 'b3', categoryId: 'boisson', name: 'Coca-Cola Cherry', price: 2.00, desc: '33 cl', img: '/images/boissons/coca-cola-cherry.png', order: 30 },
  { id: 'b4', categoryId: 'boisson', name: 'Fanta Orange', price: 2.00, desc: '33 cl', img: '/images/boissons/fanta-orange.png', order: 40 },
  { id: 'b5', categoryId: 'boisson', name: 'Sprite', price: 2.00, desc: '33 cl', img: '/images/boissons/sprite.png', order: 50 },
  { id: 'b6', categoryId: 'boisson', name: 'Oasis Tropical', price: 2.00, desc: '33 cl', img: '/images/boissons/oasis-tropical.png', order: 60 },
  { id: 'b7', categoryId: 'boisson', name: 'Oasis Pomme Cassis Framboise', price: 2.00, desc: '33 cl', img: '/images/boissons/oasis-pomme-cassis-framboise.png', order: 70 },
  { id: 'b8', categoryId: 'boisson', name: 'Ice Tea Pêche', price: 2.00, desc: '33 cl', img: '/images/boissons/ice-tea-peche.png', order: 80 },
  { id: 'b9', categoryId: 'boisson', name: 'Orangina', price: 2.00, desc: '33 cl', img: '/images/boissons/orangina.png', order: 90 },
  { id: 'b10', categoryId: 'boisson', name: 'Schweppes Agrumes', price: 2.00, desc: '33 cl', img: '/images/boissons/schweppes-agrumes.png', order: 100 },
  { id: 'b11', categoryId: 'boisson', name: 'Perrier', price: 2.00, desc: '33 cl', img: '/images/boissons/perrier.png', order: 110 },
  { id: 'b12', categoryId: 'boisson', name: 'Evian', price: 2.00, desc: '50 cl', img: '/images/boissons/evian.png', order: 120 },
  // Desserts (communs aux deux sites)
  { id: 'd1', categoryId: 'dessert', name: 'Tiramisu Classique', price: 5.90, desc: 'Mascarpone crémeux, biscuit imbibé au café, cacao', img: '/images/desserts/tiramisu-classique.png', tag: 'Tiramisu', order: 10 },
  { id: 'd2', categoryId: 'dessert', name: 'Tiramisu Nutella', price: 6.50, desc: 'Mascarpone crémeux, biscuit, noisettes, coulis Nutella', img: '/images/desserts/tiramisu-nutella.png', tag: 'Tiramisu', order: 20 },
  { id: 'd3', categoryId: 'dessert', name: 'Fondant au Chocolat', price: 5.50, desc: 'Cœur coulant au chocolat noir, servi tiède', img: '/images/desserts/fondant-chocolat.png', tag: 'Gourmands', order: 30 },
  { id: 'd4', categoryId: 'dessert', name: 'Cheesecake', price: 5.90, desc: 'Cheesecake New-Yorkais, coulis de fruits rouges', img: '/images/desserts/cheesecake.png', tag: 'Gourmands', order: 40 },
  { id: 'd5', categoryId: 'dessert', name: 'Cookie 3 Chocolats', price: 3.90, desc: 'Chocolat noir, lait et blanc, moelleux au cœur', img: '/images/desserts/cookie-3-chocolats.png', tag: 'Cookies', order: 50 },
  { id: 'd6', categoryId: 'dessert', name: 'Cookie Nutella', price: 4.50, desc: 'Cœur fondant au Nutella, noisettes', img: '/images/desserts/cookie-nutella.png', tag: 'Cookies', order: 60 },
  { id: 'd7', categoryId: 'dessert', name: 'Pizza Nutella', price: 7.90, desc: 'Pâte briochée, Nutella, éclats de noisettes, banane', img: '/images/desserts/pizza-nutella.png', tag: 'Pizzas sucrées', order: 70 },
  { id: 'd8', categoryId: 'dessert', name: 'Pizza Nutella & Kinder', price: 8.90, desc: 'Pâte briochée, Nutella, Kinder, fraises', img: '/images/desserts/pizza-nutella-kinder.png', tag: 'Pizzas sucrées', order: 80 },
].map((p) => ({ badge: null, tag: null, hot: false, veg: false, popular: false, active: true, ...p }));

// Configurateurs "Compose ta recette" — deux entrées fixes (pizza / pannuezo),
// id de doc = clé utilisée par priceCart pour 'custom-pizza' / 'custom-pannuezo'.
export const DEFAULT_CONFIGURATORS = [
  {
    id: 'pizza',
    categoryId: 'compose-pizza',
    label: 'Pizza',
    img: '/images/pizza-card.png',
    basePrice: 8.90,
    active: true,
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
  {
    id: 'pannuezo',
    categoryId: 'compose-pannuezo',
    label: 'Pannuezo',
    img: '/images/pannuezo-card.png',
    basePrice: 9.90,
    active: true,
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
];

export const DEFAULT_OPTION_PRICES = {
  'Fromage supplémentaire': 1.00,
  'Base épicée': 0.50,
};

export const DEFAULT_DELIVERY_FEE = 2.50;
export const DEFAULT_FREE_DELIVERY_THRESHOLD = 25;
