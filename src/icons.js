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
  eye: "<path d='M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z'/><circle cx='12' cy='12' r='3'/>",
  'eye-off': "<path d='M3 3l18 18'/><path d='M10.6 5.2A10.6 10.6 0 0 1 12 5c6 0 9.5 7 9.5 7a15.6 15.6 0 0 1-3 3.9M6.5 6.6C4 8.3 2.5 12 2.5 12s3.5 7 9.5 7a9.7 9.7 0 0 0 3.3-.6'/><path d='M9.5 10a3 3 0 0 0 4.2 4.2'/>",
  pencil: "<path d='M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z'/><path d='m14.5 6.5 3 3'/>",
  trash: "<path d='M5 7h14'/><path d='M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'/><path d='M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13'/><path d='M10 11v6M14 11v6'/>",
  chevron: "<path d='m6 9 6 6 6-6'/>",
  grip: "<circle cx='9' cy='6' r='1.3' fill='currentColor' stroke='none'/><circle cx='15' cy='6' r='1.3' fill='currentColor' stroke='none'/><circle cx='9' cy='12' r='1.3' fill='currentColor' stroke='none'/><circle cx='15' cy='12' r='1.3' fill='currentColor' stroke='none'/><circle cx='9' cy='18' r='1.3' fill='currentColor' stroke='none'/><circle cx='15' cy='18' r='1.3' fill='currentColor' stroke='none'/>",
  copy: "<rect x='9' y='9' width='11' height='11' rx='2'/><path d='M5 15V5a2 2 0 0 1 2-2h10'/>",
  delivery: "<path d='M3 6h11v11H3z'/><path d='M14 10h4l3 3v4h-7z'/><circle cx='7' cy='19' r='2'/><circle cx='18' cy='19' r='2'/>",
  fire: "<path d='M13 3c.5 3-2 4.5-2 7 0 1.5 1 2.5 2.5 2.5C16 12.5 17 10 16 8c3 2 4 4.2 4 7a8 8 0 0 1-16 0c0-4.5 3.2-7.7 6.8-10.5-.3 2.2.3 3.5 1.2 4.5C13 7 13.5 5 13 3Z'/>",
  home: "<path d='M3 10.5 12 3l9 7.5'/><path d='M5.5 9.5V21h13V9.5'/><path d='M9.5 21v-6h5v6'/>",
  info: "<circle cx='12' cy='12' r='9'/><path d='M12 11v6'/><circle cx='12' cy='7.5' r='.6' fill='currentColor' stroke='none'/>",
  list: "<circle cx='4.5' cy='6' r='1.4' fill='currentColor' stroke='none'/><path d='M9 6h11'/><circle cx='4.5' cy='12' r='1.4' fill='currentColor' stroke='none'/><path d='M9 12h11'/><circle cx='4.5' cy='18' r='1.4' fill='currentColor' stroke='none'/><path d='M9 18h11'/>",
  location: "<path d='M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z'/><circle cx='12' cy='10' r='2.5'/>",
  lock: "<rect x='4' y='10' width='16' height='10' rx='2'/><path d='M7 10V7a5 5 0 0 1 10 0v3'/>",
  logout: "<path d='M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3'/><path d='M16 17l5-5-5-5'/><path d='M21 12H9'/>",
  menu: "<path d='M4 5h16M4 12h16M4 19h16'/>",
  minus: "<path d='M5 12h14'/>",
  moon: "<path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z'/>",
  'payment-card': "<rect x='3' y='5' width='18' height='14' rx='2'/><path d='M3 9h18M7 15h4'/>",
  mail: "<rect x='3' y='5' width='18' height='14' rx='2'/><path d='m4 6.5 8 6 8-6'/>",
  phone: "<path d='M7 3h3l1.5 4-2 1.5a13 13 0 0 0 6 6l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C10.7 19 5 13.3 5 6c0-1.7.9-3 2-3Z'/>",
  plus: "<path d='M12 5v14M5 12h14'/>",
  star: "<path d='m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z'/>",
  tracking: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7v5l3 2'/>",
  whatsapp: "<path d='M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm5.4 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.7-2.8-1-4.6-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.8 1.9.9 2 .1.2.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.6-.7c.2-.3.4-.2.7-.1l1.7.8c.3.1.5.2.5.4.1.2.1.9-.1 1.5z' fill='currentColor' stroke='none'/>",
  chef: "<path d='M8 21h8M9 21v-6.2M15 21v-6.2'/><path d='M6.5 10.2a3 3 0 0 1 .3-6 3.6 3.6 0 0 1 6.9-1.4A3.4 3.4 0 0 1 17.5 4a3 3 0 0 1 .5 6c.1 2.8-1.1 4.8-3 4.8H9.3c-1.9 0-2.9-2-2.8-4.6Z'/>",
  warning: "<path d='M12 3 22 20H2Z'/><path d='M12 9.5v5'/><circle cx='12' cy='17.5' r='.6' fill='currentColor' stroke='none'/>",
};

// name: clé ci-dessus. cls: classe(s) CSS additionnelle(s). filled: rempli (ex. étoiles de notation).
export function icon(name, cls = '', filled = false) {
  const body = PATHS[name];
  if (!body) return '';
  const fillAttr = filled ? "fill='currentColor' stroke='none'" : "fill='none' stroke='currentColor'";
  const cls2 = cls ? `icon ${cls}` : 'icon';
  return `<svg class="${cls2}" viewBox='0 0 24 24' ${fillAttr} stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' focusable='false'>${body}</svg>`;
}

export function stars(n = 5, cls = '') {
  return Array.from({ length: n }).map(() => icon('star', cls, true)).join('');
}
