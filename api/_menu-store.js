import { getFirestore } from './_firebase.js';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_CONFIGURATORS,
  DEFAULT_OPTION_PRICES,
  DEFAULT_DELIVERY_FEE,
  DEFAULT_FREE_DELIVERY_THRESHOLD,
} from './_menu-defaults.js';

// Couche d'accès au catalogue (catégories / produits / configurateurs / réglages)
// stocké dans Firestore, avec un petit cache mémoire par instance serverless.
//
// Pourquoi un cache : le plan gratuit Firebase (Spark) limite à 50 000 lectures/jour.
// Sans cache, CHAQUE visite du site + CHAQUE commande relirait tout le catalogue.
// Avec un cache de 60s, une instance serverless "chaude" (appelée plusieurs fois de
// suite par Vercel) ne relit Firestore qu'une fois par minute maximum, quel que soit
// le nombre de visiteurs servis pendant ce temps. Le cache est vidé immédiatement dès
// qu'un admin modifie le menu, pour que les changements soient visibles tout de suite.

const CACHE_TTL_MS = 60_000;
let cache = null; // { at: number, data: Catalog }

const COLLECTIONS = {
  categories: 'menu_categories',
  products: 'menu_products',
  configurators: 'menu_configurators',
  settings: 'menu_settings',
};

function invalidateCache() {
  cache = null;
}

async function seedIfEmpty(db) {
  const snap = await db.collection(COLLECTIONS.categories).limit(1).get();
  if (!snap.empty) return;
  const batch = db.batch();
  DEFAULT_CATEGORIES.forEach((c) => batch.set(db.collection(COLLECTIONS.categories).doc(c.slug), c));
  DEFAULT_PRODUCTS.forEach((p) => batch.set(db.collection(COLLECTIONS.products).doc(p.id), p));
  DEFAULT_CONFIGURATORS.forEach((c) => batch.set(db.collection(COLLECTIONS.configurators).doc(c.id), c));
  batch.set(db.collection(COLLECTIONS.settings).doc('global'), {
    optionPrices: DEFAULT_OPTION_PRICES,
    deliveryFee: DEFAULT_DELIVERY_FEE,
    freeDeliveryThreshold: DEFAULT_FREE_DELIVERY_THRESHOLD,
  });
  await batch.commit();
}

// Renvoie tout le catalogue en un seul objet. Utilise le cache mémoire si frais,
// sinon relit Firestore. Si Firestore n'a jamais été initialisé (première install,
// avant le seed), l'initialise automatiquement avec le contenu par défaut.
export async function getCatalog({ bypassCache = false } = {}) {
  if (!bypassCache && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }
  try {
    const db = getFirestore();
    await seedIfEmpty(db);
    const [catSnap, prodSnap, cfgSnap, settingsSnap] = await Promise.all([
      db.collection(COLLECTIONS.categories).get(),
      db.collection(COLLECTIONS.products).get(),
      db.collection(COLLECTIONS.configurators).get(),
      db.collection(COLLECTIONS.settings).doc('global').get(),
    ]);
    const data = {
      categories: catSnap.docs.map((d) => ({ slug: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0)),
      products: prodSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0)),
      configurators: cfgSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      settings: settingsSnap.exists
        ? settingsSnap.data()
        : { optionPrices: DEFAULT_OPTION_PRICES, deliveryFee: DEFAULT_DELIVERY_FEE, freeDeliveryThreshold: DEFAULT_FREE_DELIVERY_THRESHOLD },
    };
    cache = { at: Date.now(), data };
    return data;
  } catch (err) {
    // Filet de sécurité : si Firestore est injoignable (quota dépassé, panne, mauvaise
    // config), le site continue de fonctionner avec le catalogue par défaut plutôt que
    // de planter entièrement. Les prix restent cohérents (mêmes valeurs que le seed).
    console.error('getCatalog: Firestore indisponible, utilisation du catalogue par défaut.', err.message);
    return {
      categories: DEFAULT_CATEGORIES,
      products: DEFAULT_PRODUCTS,
      configurators: DEFAULT_CONFIGURATORS,
      settings: { optionPrices: DEFAULT_OPTION_PRICES, deliveryFee: DEFAULT_DELIVERY_FEE, freeDeliveryThreshold: DEFAULT_FREE_DELIVERY_THRESHOLD },
    };
  }
}

function slugify(s) {
  return String(s).toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'categorie';
}

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

// Ajoute dans Firestore les catégories/produits présents dans les défauts du code
// (_menu-defaults.js) mais absents de la base — utile quand on ajoute une nouvelle
// catégorie/de nouveaux produits en dur après le premier seed (qui ne se rejoue
// jamais tout seul). Ne touche jamais à un document déjà existant (pas d'écrasement
// des modifs faites depuis l'admin).
export async function syncMissingDefaults() {
  const db = getFirestore();
  const [catSnap, prodSnap] = await Promise.all([
    db.collection(COLLECTIONS.categories).get(),
    db.collection(COLLECTIONS.products).get(),
  ]);
  const existingCatSlugs = new Set(catSnap.docs.map((d) => d.id));
  const existingProdIds = new Set(prodSnap.docs.map((d) => d.id));

  const missingCategories = DEFAULT_CATEGORIES.filter((c) => !existingCatSlugs.has(c.slug));
  const missingProducts = DEFAULT_PRODUCTS.filter((p) => !existingProdIds.has(p.id));

  if (!missingCategories.length && !missingProducts.length) {
    return { addedCategories: [], addedProducts: [] };
  }

  const batch = db.batch();
  missingCategories.forEach((c) => batch.set(db.collection(COLLECTIONS.categories).doc(c.slug), c));
  missingProducts.forEach((p) => batch.set(db.collection(COLLECTIONS.products).doc(p.id), p));
  await batch.commit();
  invalidateCache();

  return {
    addedCategories: missingCategories.map((c) => c.label),
    addedProducts: missingProducts.map((p) => p.name),
  };
}

// ---- Catégories ----

export async function createCategory({ label, sites, kind, order }) {
  const db = getFirestore();
  let slug = slugify(label);
  const existing = await db.collection(COLLECTIONS.categories).doc(slug).get();
  if (existing.exists) slug = `${slug}-${Date.now().toString(36)}`;
  const doc = { slug, label: String(label).slice(0, 60), sites: Array.isArray(sites) && sites.length ? sites : ['main'], kind: kind === 'configurator' ? 'configurator' : 'products', order: Number.isFinite(order) ? order : 999, active: true };
  await db.collection(COLLECTIONS.categories).doc(slug).set(doc);
  invalidateCache();
  return doc;
}

export async function updateCategory(slug, patch) {
  const db = getFirestore();
  const ref = db.collection(COLLECTIONS.categories).doc(slug);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Catégorie introuvable');
  const allowed = ['label', 'sites', 'order', 'active'];
  const clean = {};
  for (const k of allowed) if (k in patch) clean[k] = patch[k];
  await ref.update(clean);
  invalidateCache();
  return { slug, ...snap.data(), ...clean };
}

export async function deleteCategory(slug) {
  const db = getFirestore();
  const productsSnap = await db.collection(COLLECTIONS.products).where('categoryId', '==', slug).limit(1).get();
  if (!productsSnap.empty) {
    throw new Error('Cette catégorie contient encore des produits : déplace-les ou supprime-les d’abord.');
  }
  await db.collection(COLLECTIONS.categories).doc(slug).delete();
  invalidateCache();
}

// ---- Produits ----

export async function createProduct(input) {
  const db = getFirestore();
  const id = genId('prod');
  const doc = {
    id,
    categoryId: String(input.categoryId || ''),
    name: String(input.name || '').slice(0, 100),
    price: Math.max(0, Number(input.price) || 0),
    desc: String(input.desc || '').slice(0, 300),
    img: String(input.img || '/images/logo.png'),
    badge: input.badge ? String(input.badge).slice(0, 40) : null,
    tag: input.tag ? String(input.tag).slice(0, 40) : null,
    hot: !!input.hot,
    veg: !!input.veg,
    popular: !!input.popular,
    active: input.active !== false,
    order: Number.isFinite(input.order) ? input.order : 999,
  };
  if (!doc.categoryId) throw new Error('Catégorie requise');
  if (!doc.name) throw new Error('Nom requis');
  await db.collection(COLLECTIONS.products).doc(id).set(doc);
  invalidateCache();
  return doc;
}

export async function updateProduct(id, patch) {
  const db = getFirestore();
  const ref = db.collection(COLLECTIONS.products).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Produit introuvable');
  const allowed = ['categoryId', 'name', 'price', 'desc', 'img', 'badge', 'tag', 'hot', 'veg', 'popular', 'active', 'order'];
  const clean = {};
  for (const k of allowed) {
    if (!(k in patch)) continue;
    if (k === 'price') clean.price = Math.max(0, Number(patch.price) || 0);
    else if (k === 'name') clean.name = String(patch.name).slice(0, 100);
    else if (k === 'desc') clean.desc = String(patch.desc).slice(0, 300);
    else clean[k] = patch[k];
  }
  await ref.update(clean);
  invalidateCache();
  return { id, ...snap.data(), ...clean };
}

export async function deleteProduct(id) {
  const db = getFirestore();
  await db.collection(COLLECTIONS.products).doc(id).delete();
  invalidateCache();
}

// ---- Configurateurs ("Compose ta recette") ----

export async function updateConfigurator(id, patch) {
  const db = getFirestore();
  const ref = db.collection(COLLECTIONS.configurators).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Configurateur introuvable');
  const allowed = ['label', 'img', 'basePrice', 'active', 'bases', 'sauces', 'ingredients'];
  const clean = {};
  for (const k of allowed) {
    if (!(k in patch)) continue;
    if (k === 'basePrice') clean.basePrice = Math.max(0, Number(patch.basePrice) || 0);
    else clean[k] = patch[k];
  }
  await ref.update(clean);
  invalidateCache();
  return { id, ...snap.data(), ...clean };
}

// ---- Réglages globaux (frais de livraison, seuil offert, options payantes) ----

export async function updateSettings(patch) {
  const db = getFirestore();
  const ref = db.collection(COLLECTIONS.settings).doc('global');
  const allowed = ['optionPrices', 'deliveryFee', 'freeDeliveryThreshold'];
  const clean = {};
  for (const k of allowed) {
    if (!(k in patch)) continue;
    if (k === 'deliveryFee' || k === 'freeDeliveryThreshold') clean[k] = Math.max(0, Number(patch[k]) || 0);
    else clean[k] = patch[k];
  }
  await ref.set(clean, { merge: true });
  invalidateCache();
  const snap = await ref.get();
  return snap.data();
}
