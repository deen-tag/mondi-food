// Boissons et desserts sont communs au site principal (main.js) et à Mondi Night
// (night.js) — définis une seule fois ici pour ne pas les dupliquer et pour que
// toute modification (prix, description, photo) se répercute aux deux endroits.

export const BOISSONS = [
  { id: 'b1', type: 'boisson', name: 'Coca-Cola', price: 2.00, desc: '33 cl', img: '/images/boissons/coca-cola.png' },
  { id: 'b2', type: 'boisson', name: 'Coca-Cola Zéro', price: 2.00, desc: '33 cl', img: '/images/boissons/coca-cola-zero.png' },
  { id: 'b3', type: 'boisson', name: 'Coca-Cola Cherry', price: 2.00, desc: '33 cl', img: '/images/boissons/coca-cola-cherry.png' },
  { id: 'b4', type: 'boisson', name: 'Fanta Orange', price: 2.00, desc: '33 cl', img: '/images/boissons/fanta-orange.png' },
  { id: 'b5', type: 'boisson', name: 'Sprite', price: 2.00, desc: '33 cl', img: '/images/boissons/sprite.png' },
  { id: 'b6', type: 'boisson', name: 'Oasis Tropical', price: 2.00, desc: '33 cl', img: '/images/boissons/oasis-tropical.png' },
  { id: 'b7', type: 'boisson', name: 'Oasis Pomme Cassis Framboise', price: 2.00, desc: '33 cl', img: '/images/boissons/oasis-pomme-cassis-framboise.png' },
  { id: 'b8', type: 'boisson', name: 'Ice Tea Pêche', price: 2.00, desc: '33 cl', img: '/images/boissons/ice-tea-peche.png' },
  { id: 'b9', type: 'boisson', name: 'Orangina', price: 2.00, desc: '33 cl', img: '/images/boissons/orangina.png' },
  { id: 'b10', type: 'boisson', name: 'Schweppes Agrumes', price: 2.00, desc: '33 cl', img: '/images/boissons/schweppes-agrumes.png' },
  { id: 'b11', type: 'boisson', name: 'Perrier', price: 2.00, desc: '33 cl', img: '/images/boissons/perrier.png' },
  { id: 'b12', type: 'boisson', name: 'Evian', price: 2.00, desc: '50 cl', img: '/images/boissons/evian.png' },
];

export const DESSERTS = [
  { id: 'd1', type: 'dessert', name: 'Tiramisu Classique', price: 5.90, desc: 'Mascarpone crémeux, biscuit imbibé au café, cacao', img: '/images/desserts/tiramisu-classique.png', tag: 'Tiramisu' },
  { id: 'd2', type: 'dessert', name: 'Tiramisu Nutella', price: 6.50, desc: 'Mascarpone crémeux, biscuit, noisettes, coulis Nutella', img: '/images/desserts/tiramisu-nutella.png', tag: 'Tiramisu' },
  { id: 'd3', type: 'dessert', name: 'Fondant au Chocolat', price: 5.50, desc: 'Cœur coulant au chocolat noir, servi tiède', img: '/images/desserts/fondant-chocolat.png', tag: 'Gourmands' },
  { id: 'd4', type: 'dessert', name: 'Cheesecake', price: 5.90, desc: 'Cheesecake New-Yorkais, coulis de fruits rouges', img: '/images/desserts/cheesecake.png', tag: 'Gourmands' },
  { id: 'd5', type: 'dessert', name: 'Cookie 3 Chocolats', price: 3.90, desc: 'Chocolat noir, lait et blanc, moelleux au cœur', img: '/images/desserts/cookie-3-chocolats.png', tag: 'Cookies' },
  { id: 'd6', type: 'dessert', name: 'Cookie Nutella', price: 4.50, desc: 'Cœur fondant au Nutella, noisettes', img: '/images/desserts/cookie-nutella.png', tag: 'Cookies' },
  { id: 'd7', type: 'dessert', name: 'Pizza Nutella', price: 7.90, desc: 'Pâte briochée, Nutella, éclats de noisettes, banane', img: '/images/desserts/pizza-nutella.png', tag: 'Pizzas sucrées' },
  { id: 'd8', type: 'dessert', name: 'Pizza Nutella & Kinder', price: 8.90, desc: 'Pâte briochée, Nutella, Kinder, fraises', img: '/images/desserts/pizza-nutella-kinder.png', tag: 'Pizzas sucrées' },
];
