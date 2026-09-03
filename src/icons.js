// Icônes SVG (adaptées des assets fournis) — stroke='currentColor' pour hériter
// automatiquement de la couleur du texte parent, dimensionnées en 1em pour
// suivre le font-size du contexte (header, nav, cartes, etc.)

const PATHS = {
  'arrow-left': "<path d='M20 12H5'/><path d='m11 6-6 6 6 6'/>",
  'arrow-right': "<path d='M4 12h15'/><path d='m13 6 6 6-6 6'/>",
  cart: "<path d='M3 4h2l2.1 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20.5 8H6'/><circle cx='9' cy='20' r='1'/><circle cx='18' cy='20' r='1'/>",
  cash: "<rect x='3' y='6' width='18' height='12' rx='2'/><circle cx='12' cy='12' r='3'/><path d='M6 10h.01M18 14h.01'/>",
  check: "<circle cx='12' cy='12' r='9'/><path d='m8 12 2.6 2.6L16.5 9'/>",
  clock: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7v5l3 2'/>",
  close: "<path d='m6 6 12 12M18 6 6 18'/>",
  delivery: "<path d='M3 6h11v11H3z'/><path d='M14 10h4l3 3v4h-7z'/><circle cx='7' cy='19' r='2'/><circle cx='18' cy='19' r='2'/>",
  fire: "<path d='M13 3c.5 3-2 4.5-2 7 0 1.5 1 2.5 2.5 2.5C16 12.5 17 10 16 8c3 2 4 4.2 4 7a8 8 0 0 1-16 0c0-4.5 3.2-7.7 6.8-10.5-.3 2.2.3 3.5 1.2 4.5C13 7 13.5 5 13 3Z'/>",
  home: "<path d='M3 10.5 12 3l9 7.5'/><path d='M5.5 9.5V21h13V9.5'/><path d='M9.5 21v-6h5v6'/>",
  location: "<path d='M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z'/><circle cx='12' cy='10' r='2.5'/>",
  lock: "<rect x='4' y='10' width='16' height='10' rx='2'/><path d='M7 10V7a5 5 0 0 1 10 0v3'/>",
  menu: "<path d='M4 5h16M4 12h16M4 19h16'/>",
  minus: "<path d='M5 12h14'/>",
  'payment-card': "<rect x='3' y='5' width='18' height='14' rx='2'/><path d='M3 9h18M7 15h4'/>",
  phone: "<path d='M7 3h3l1.5 4-2 1.5a13 13 0 0 0 6 6l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C10.7 19 5 13.3 5 6c0-1.7.9-3 2-3Z'/>",
  plus: "<path d='M12 5v14M5 12h14'/>",
  star: "<path d='m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z'/>",
  tracking: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7v5l3 2'/>",
};

// name: clé ci-dessus. cls: classe(s) CSS additionnelle(s). filled: rempli (ex. étoiles de notation).
export function icon(name, cls = '', filled = false) {
  const body = PATHS[name];
  if (!body) return '';
  const fillAttr = filled ? "fill='currentColor' stroke='none'" : "fill='none' stroke='currentColor'";
  const cls2 = cls ? `icon ${cls}` : 'icon';
  return `<svg class="${cls2}" viewBox='0 0 24 24' ${fillAttr} stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' focusable='false'>${body}</svg>`;
}

export function stars(n = 5, cls = '') {
  return Array.from({ length: n }).map(() => icon('star', cls, true)).join('');
}
