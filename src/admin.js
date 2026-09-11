import './admin.css';
import { icon } from './icons.js';

const STATUS = { received: 'Nouvelle', preparing: 'En préparation', delivering: 'En livraison', delivered: 'Livrée', cancelled: 'Annulée' };
const CANCEL_REASONS = ['Client absent', 'Produit indisponible', 'Problème de paiement', 'Adresse incorrecte', 'Annulation client', 'Autre'];

const AS = {
  authed: null, // null = pas encore vérifié
  view: 'dashboard',
  filter: 'toutes',
  search: '',
  selected: null,
  orders: [],
  drivers: [],
  promoCodes: [],
  knownNew: new Set(),
  loading: true,
  activeCount: null, // dernier compteur "ping" connu (received+preparing+delivering)
  globalStats: null, // { totalOrders, totalRevenue } depuis toujours, chargé une fois
  pushSubscribed: false, // abonné aux notifs push (Service Worker) ?
  menu: null, // catalogue { categories, products, configurators, settings }, chargé à la demande
  menuSub: 'categories', // sous-onglet de "Menu" : categories | products | builder | settings
  menuProductFilter: 'all',
  menuForm: null, // { kind:'category'|'product', data:{...} } pendant une création/édition
};

const formatPrice = n => (+n).toFixed(2).replace('.', ',') + ' €';
const hm = iso => iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
const dm = iso => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '';
const isToday = iso => new Date(iso).toDateString() === new Date().toDateString();
const isYesterday = iso => { const y = new Date(); y.setDate(y.getDate() - 1); return new Date(iso).toDateString() === y.toDateString(); };
const isThisWeek = iso => (Date.now() - new Date(iso).getTime()) < 7 * 86400000;

const ORIGINAL_TITLE = 'Mondi Food — Admin';
let titleBlinkTimer = null;

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.08;
    o.start(); o.stop(ctx.currentTime + 0.18);
  } catch {}
}

// ---------- Notifications navigateur (immédiates, onglet ouvert) ----------
function notifyDesktop(count) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(count > 1 ? `${count} nouvelles commandes` : 'Nouvelle commande', {
      body: 'Ouvre le dashboard pour la traiter.',
      tag: 'mondi-new-order', // évite d'empiler des notifs, juste la dernière
    });
  } catch {}
}

// ---------- Push (Service Worker) : notifs même onglet/navigateur fermé ----------
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function checkPushStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const sub = await reg.pushManager.getSubscription();
    AS.pushSubscribed = !!sub;
  } catch { AS.pushSubscribed = false; }
  renderRoot();
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Ton navigateur ne supporte pas les notifications push.');
    return;
  }
  try {
    // Profite du geste utilisateur (clic sur la cloche) pour aussi demander la permission
    // de notification navigateur "immédiate" (onglet ouvert), sinon notifyDesktop() ne
    // s'active jamais : elle vérifie la permission mais ne la demande nulle part ailleurs.
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    const { publicKey } = await api('/api/push-subscribe');
    if (!publicKey) { alert('Notifications push pas encore configurées côté serveur.'); return; }
    const reg = await navigator.serviceWorker.register('/sw.js');
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await api('/api/push-subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub }) });
    AS.pushSubscribed = true;
    renderRoot();
  } catch (err) {
    console.error(err);
    alert('Impossible d’activer les notifications push. Vérifie que tu as autorisé les notifications pour ce site.');
  }
}

async function unsubscribeFromPush() {
  if (!confirm('Désactiver les notifications push sur cet appareil ?')) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await api('/api/push-subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
    AS.pushSubscribed = false;
    renderRoot();
  } catch (err) {
    console.error(err);
    alert('Impossible de désactiver les notifications.');
  }
}

function startTitleBlink(count) {
  stopTitleBlink();
  const alt = count > 1 ? `🔴 (${count}) Nouvelles commandes` : '🔴 (1) Nouvelle commande';
  let on = false;
  titleBlinkTimer = setInterval(() => { document.title = on ? ORIGINAL_TITLE : alt; on = !on; }, 1000);
}

function stopTitleBlink() {
  if (titleBlinkTimer) { clearInterval(titleBlinkTimer); titleBlinkTimer = null; }
  document.title = ORIGINAL_TITLE;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) stopTitleBlink(); // l'admin regarde à nouveau l'onglet
});

// ---------- Couche API ----------
async function api(path, opts = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (res.status === 401) { AS.authed = false; renderRoot(); throw new Error('unauth'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

async function refresh() {
  try {
    const [o, d, p] = await Promise.all([api('/api/orders'), api('/api/drivers'), api('/api/orders?promo=1')]);
    AS.orders = o.orders || [];
    AS.drivers = d.drivers || [];
    AS.promoCodes = p.promoCodes || [];
    AS.activeCount = AS.orders.filter(o => ['received', 'preparing', 'delivering'].includes(o.status)).length;
    checkNewOrders();
  } catch {}
  AS.loading = false;
  renderRoot();
}

// Vérification "légère" toutes les 15s : un seul compteur (quasi gratuit côté
// Firestore), pas la liste complète. On ne va chercher la liste complète que si
// ce compteur a changé depuis la dernière fois, càd qu'il y a du nouveau.
async function pingCheck() {
  try {
    const r = await api('/api/orders?ping=1');
    if (AS.activeCount === null) { AS.activeCount = r.active; return; }
    if (r.active !== AS.activeCount) await refresh();
  } catch {}
}

// Chargé une seule fois à l'ouverture de l'onglet Historique (pas de polling ici).
async function loadGlobalStats() {
  if (AS.globalStats) return;
  try {
    AS.globalStats = await api('/api/orders?stats=1');
    renderRoot();
  } catch {}
}

// Chargé à l'ouverture de l'onglet Menu (pas de polling : le gérant recharge lui-même
// via les actions ci-dessous, pas besoin de re-tirer Firestore en continu).
async function loadMenu(force) {
  if (AS.menu && !force) { renderRoot(); return; }
  try {
    AS.menu = await api('/api/menu');
    renderRoot();
  } catch (err) {
    alert(err.message || 'Impossible de charger le menu.');
  }
}

function checkNewOrders() {
  const fresh = AS.orders.filter(o => o.status === 'received');
  let isNew = false;
  fresh.forEach(o => { if (!AS.knownNew.has(o.id)) { AS.knownNew.add(o.id); isNew = true; } });
  if (isNew && AS.view === 'dashboard' && !AS.loading) {
    if (document.hidden) {
      // Onglet en arrière-plan : notif système + titre clignotant, pas de bip inutile.
      notifyDesktop(fresh.length);
      startTitleBlink(fresh.length);
    } else {
      beep();
    }
  }
}

// ---------- Shell ----------
async function init() {
  try {
    const s = await api('/api/admin-auth');
    AS.authed = s.authed;
  } catch { AS.authed = false; }
  if (AS.authed) { refresh(); checkPushStatus(); }
  else renderRoot();
}

function renderRoot() {
  const root = document.querySelector('#root');
  if (!AS.authed) { root.innerHTML = loginView(); bindLogin(); return; }
  root.innerHTML = `<div class="admin">${header()}<main id="ascreen">${AS.loading ? '<p class="aEmpty">Chargement…</p>' : screen()}</main></div>`;
  bind();
}

function loginView() {
  return `<div class="adminLogin"><img src="/logo.png"><h1>ADMIN</h1><p>Espace réservé à l'équipe Mondi Food</p>
  <form id="loginForm"><input type="password" name="pass" placeholder="Mot de passe" required autofocus>
  <button class="cta wide" type="submit">SE CONNECTER ${icon('arrow-right')}</button></form>
  <small id="loginErr"></small></div>`;
}
function bindLogin() {
  document.querySelector('#loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const pass = new FormData(e.target).get('pass');
    try {
      await api('/api/admin-auth', { method: 'POST', body: JSON.stringify({ action: 'login', password: pass }) });
      AS.authed = true; AS.loading = true; renderRoot(); refresh(); checkPushStatus();
    } catch { document.querySelector('#loginErr').textContent = 'Mot de passe incorrect.'; }
  });
}

function header() {
  const news = AS.orders.filter(o => o.status === 'received').length;
  const pushOk = 'serviceWorker' in navigator && 'PushManager' in window;
  return `<header class="aHeader">
  <div class="aHeaderTop">
   <span class="aLogo">${icon('fire', '', true)} MONDI FOOD <b>ADMIN</b></span>
   <div class="aHeaderActions">
    ${pushOk ? `<button class="aBell ${AS.pushSubscribed ? 'on' : ''}" data-toggle-push title="${AS.pushSubscribed ? 'Désactiver les notifications push' : 'Activer les notifications push'}">${AS.pushSubscribed ? '🔔' : '🔕'}</button>` : ''}
    <button class="aCloseBtn" data-logout title="Déconnexion">${icon('close')}</button>
   </div>
  </div>
  <nav class="aTabs">
   <button data-view="dashboard" class="${AS.view === 'dashboard' ? 'on' : ''}">Dashboard${news ? `<em>${news}</em>` : ''}</button>
   <button data-view="menu" class="${AS.view === 'menu' ? 'on' : ''}">Menu</button>
   <button data-view="drivers" class="${AS.view === 'drivers' ? 'on' : ''}">Livreurs</button>
   <button data-view="promo" class="${AS.view === 'promo' ? 'on' : ''}">Codes promo</button>
   <button data-view="history" class="${AS.view === 'history' ? 'on' : ''}">Historique</button>
  </nav>
  </header>`;
}

function screen() {
  if (AS.view === 'order') return orderView();
  if (AS.view === 'menu') return menuView();
  if (AS.view === 'drivers') return driversView();
  if (AS.view === 'promo') return promoView();
  if (AS.view === 'history') return historyView();
  return dashboardView();
}

// ---------- Dashboard ----------
function dashboardView() {
  const all = AS.orders;
  const news = all.filter(o => o.status === 'received');
  const cuisine = all.filter(o => o.status === 'preparing');
  const livraison = all.filter(o => o.status === 'delivering');
  const today = all.filter(o => isToday(o.createdAt));

  let list = all;
  if (AS.search.trim()) {
    const q = AS.search.trim().toLowerCase();
    list = list.filter(o => (o.orderId || '').toLowerCase().includes(q) || (o.firstName || '').toLowerCase().includes(q) || (o.phone || '').includes(q));
  }
  if (AS.filter !== 'toutes') list = list.filter(o => o.status === AS.filter);

  const groups = AS.filter === 'toutes' ? ['received', 'preparing', 'delivering', 'delivered', 'cancelled'] : [AS.filter];
  const sectionsHtml = groups.map(st => {
    let items = list.filter(o => o.status === st);
    if (AS.filter === 'toutes' && (st === 'delivered' || st === 'cancelled')) items = items.slice(0, 6);
    if (!items.length) return '';
    return `<section class="aGroup ${st}">
    <h2>${statusIcon(st)} ${STATUS[st].toUpperCase()} <em>${items.length}</em></h2>
    <div class="aCards">${items.map(orderCard).join('')}</div>
    </section>`;
  }).join('');

  return `
  ${news.length ? `<div class="alertBar">${icon('fire', '', true)} ${news.length} NOUVELLE${news.length > 1 ? 'S' : ''} COMMANDE${news.length > 1 ? 'S' : ''}</div>` : ''}
  <div class="aStats">
   <div data-filter="received" class="${AS.filter === 'received' ? 'active' : ''}"><b>${news.length}</b><small>Nouvelles</small></div>
   <div data-filter="preparing" class="${AS.filter === 'preparing' ? 'active' : ''}"><b>${cuisine.length}</b><small>Cuisine</small></div>
   <div data-filter="delivering" class="${AS.filter === 'delivering' ? 'active' : ''}"><b>${livraison.length}</b><small>Livraison</small></div>
   <div><b>${today.length}</b><small>Aujourd'hui</small></div>
  </div>
  <div class="aToolbar"><input id="aSearch" placeholder="🔍 Rechercher commande, nom, téléphone" value="${AS.search}"></div>
  <div class="aFilters">${['toutes', 'received', 'preparing', 'delivering', 'delivered', 'cancelled'].map(f =>
    `<button data-filter="${f}" class="${AS.filter === f ? 'active' : ''}">${f === 'toutes' ? 'Toutes' : STATUS[f]}</button>`).join('')}</div>
  ${sectionsHtml || `<p class="aEmpty">Aucune commande.</p>`}
  `;
}

function statusIcon(st) {
  return { received: '🔴', preparing: '🧑‍🍳', delivering: '🛵', delivered: '✅', cancelled: '❌' }[st] || '';
}

function orderCard(o) {
  const driver = o.driverId ? AS.drivers.find(d => d.id === o.driverId) : null;
  let action = '';
  if (o.status === 'received') action = `<button class="cta small" data-act="open" data-id="${o.id}">ACCEPTER</button>`;
  else if (o.status === 'preparing') action = `<button class="cta small" data-act="ready" data-id="${o.id}">PRÊTE</button>`;
  else if (o.status === 'delivering' && !o.driverId) action = `<button class="cta small" data-act="open" data-id="${o.id}">ASSIGNER LIVREUR</button>`;
  else if (o.status === 'delivering' && o.driverId) action = `<button class="cta small" data-act="delivered" data-id="${o.id}">LIVRÉE</button>`;
  return `<article class="aCard" data-open="${o.id}">
  <div class="aCardTop"><b>#${o.orderId || o.id}</b><span>${hm(o.createdAt)}</span></div>
  <div class="aCardClient">${o.firstName || 'Client'}${driver ? ` · 🛵 ${driver.name}` : ''}</div>
  <div class="aCardAddr">📍 ${o.address || ''}${o.zip ? ', ' + o.zip : ''}</div>
  <div class="aCardBottom"><strong>${formatPrice(o.total)}</strong>${paymentBadge(o)}</div>
  <div class="aCardAct" onclick="event.stopPropagation()">${action}<button class="ghost small" data-act="open" data-id="${o.id}">Détail</button></div>
  </article>`;
}

function paymentBadge(o) {
  const map = { paye: ['🟢', 'PAYÉ'], attente: ['🟠', 'À LA LIVRAISON'], echoue: ['🔴', 'ÉCHOUÉ'] };
  const [dot, label] = map[o.paymentStatus] || ['⚪', ''];
  return `<span class="payBadge">${dot} ${label}</span>`;
}

// ---------- Détail commande ----------
function orderView() {
  const o = AS.orders.find(x => x.id === AS.selected);
  if (!o) return `<p class="aEmpty">Commande introuvable.</p>`;
  const driver = o.driverId ? AS.drivers.find(d => d.id === o.driverId) : null;
  const dispo = AS.drivers.filter(d => d.status === 'dispo');
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([o.address, o.zip, o.city].filter(Boolean).join(' '))}`;

  let action = '';
  if (o.status === 'received') {
    action = `<div class="aBox"><h3>Accepter la commande</h3>
    <label>Préparation estimée (min)<input id="prepInput" type="number" min="1" value="15"></label>
    <button class="cta wide" data-act="accept" data-id="${o.id}">ACCEPTER LA COMMANDE ${icon('arrow-right')}</button></div>`;
  } else if (o.status === 'preparing') {
    action = `<div class="aBox"><h3>🧑‍🍳 En préparation</h3><p>Prête vers <b>${hm(o.readyAt)}</b></p>
    <button class="cta wide" data-act="ready" data-id="${o.id}">COMMANDE PRÊTE ${icon('arrow-right')}</button></div>`;
  } else if (o.status === 'delivering' && !driver) {
    action = `<div class="aBox"><h3>🛵 Assigner un livreur</h3>
    ${dispo.length ? `<select id="driverSelect">${dispo.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</select>
    <button class="cta wide" data-act="assign" data-id="${o.id}">ASSIGNER ${icon('arrow-right')}</button>` : `<p class="aEmpty">Aucun livreur disponible pour le moment.</p>`}</div>`;
  } else if (o.status === 'delivering' && driver) {
    action = `<div class="aBox"><h3>🛵 Livraison en cours</h3><p>Livreur : <b>${driver.name}</b><br>Depuis ${hm(o.deliveryStartedAt)}</p>
    <button class="cta wide" data-act="delivered" data-id="${o.id}">LIVRÉE ${icon('arrow-right')}</button></div>`;
  } else if (o.status === 'delivered') {
    action = `<div class="aBox done"><h3>✅ Livrée</h3><p>Livrée à ${hm(o.deliveredAt)}${driver ? ` par ${driver.name}` : ''}</p></div>`;
  } else if (o.status === 'cancelled') {
    action = `<div class="aBox cancelled"><h3>❌ Annulée</h3><p>${o.cancelReason || ''}</p></div>`;
  }

  const payActions = o.paymentStatus !== 'paye' && o.status !== 'cancelled'
    ? `<button class="ghost small" data-act="markPaid" data-id="${o.id}">Marquer payé</button>
       <button class="ghost small" data-act="markFailed" data-id="${o.id}">Marquer échoué</button>` : '';

  const cancelBox = (o.status !== 'delivered' && o.status !== 'cancelled')
    ? `<div class="aBox danger"><h3>Annuler la commande</h3>
      <select id="cancelReason">${CANCEL_REASONS.map(r => `<option>${r}</option>`).join('')}</select>
      <button class="ghost small danger" data-act="cancel" data-id="${o.id}">Annuler la commande</button></div>` : '';

  const deleteBox = `<div class="aBox danger"><h3>Supprimer</h3>
    <p class="aMuted">Suppression définitive — utile pour effacer une commande de test. Action irréversible.</p>
    <button class="ghost small danger solid" data-act="delete" data-id="${o.id}">Supprimer définitivement</button></div>`;

  return `<button class="back" data-view="dashboard">${icon('arrow-left')} <span>Retour</span></button>
  <div class="aOrderHead"><h1>#${o.orderId || o.id}</h1><span class="statusChip ${o.status}">${statusIcon(o.status)} ${STATUS[o.status]}</span></div>
  <p class="aMuted">${dm(o.createdAt)} à ${hm(o.createdAt)}</p>

  <div class="aBox"><h3>Client</h3><p><b>${o.firstName || '—'}</b></p>
   <div class="aRow"><a class="ghost small" href="tel:${o.phone}">${icon('phone')} Appeler</a><a class="ghost small" href="sms:${o.phone}">💬 Contacter</a></div>
  </div>

  <div class="aBox"><h3>Adresse</h3><p>📍 ${o.address || '—'}${o.zip ? `, ${o.zip} ${o.city || ''}` : ''}</p>
   <a class="ghost small" href="${mapUrl}" target="_blank" rel="noopener">${icon('location')} Voir sur la carte</a>
   ${o.note ? `<p class="aNote">📝 Instructions client : « ${o.note} »</p>` : ''}
  </div>

  <div class="aBox"><h3>Commande</h3>
   <ul class="aItems">${(o.items || []).map(it => `<li><span>${it.qty}× ${it.name}${it.opts && it.opts.length ? ` <small>(${it.opts.join(', ')})</small>` : ''}</span><b>${formatPrice(it.price * it.qty)}</b></li>`).join('')}</ul>
   <div class="aTotal">Total <b>${formatPrice(o.total)}</b></div>
   <div class="aRow">${paymentBadge(o)} <span class="aMuted">${o.paymentMethod === 'online' ? 'Paiement en ligne' : 'Paiement à la livraison'}</span></div>
   <div class="aRow">${payActions}</div>
  </div>

  ${action}
  ${cancelBox}
  ${deleteBox}
  `;
}

// ---------- Livreurs ----------
function driversView() {
  const statusDot = { dispo: '🟢 Disponible', livraison: '🔴 En livraison', pause: '🟡 Pause' };
  return `
  <h1 class="aTitle">LIVREURS</h1>
  <div class="aDrivers">${AS.drivers.map(d => `
   <div class="aDriverCard">
    <div><b>🛵 ${d.name}</b><small>${statusDot[d.status]}</small></div>
    ${d.status !== 'livraison' ? `<button class="ghost small" data-driver-toggle="${d.id}">${d.status === 'pause' ? 'Rendre disponible' : 'Mettre en pause'}</button>` : `<span class="aMuted">En cours</span>`}
   </div>`).join('') || `<p class="aEmpty">Aucun livreur pour le moment.</p>`}</div>
  <div class="aBox"><h3>Ajouter un livreur</h3>
   <form id="addDriver"><input name="name" placeholder="Prénom" required><button class="cta small" type="submit">AJOUTER</button></form>
  </div>`;
}

// ---------- Codes promo ----------
function promoView() {
  return `
  <h1 class="aTitle">CODES PROMO</h1>
  <div class="aDrivers">${AS.promoCodes.map(p => {
    const expired = p.expiresAt && new Date(p.expiresAt) < new Date();
    return `
   <div class="aDriverCard">
    <div>
     <b>🏷️ ${p.code}</b>
     <small>${p.type === 'percent' ? `-${p.value}%` : `-${p.value.toFixed(2).replace('.', ',')} €`}${p.minSubtotal ? ` dès ${p.minSubtotal.toFixed(2).replace('.', ',')} €` : ''}</small>
     <small>${p.usedCount || 0} utilisation${(p.usedCount || 0) > 1 ? 's' : ''}${p.maxUses != null ? ` / ${p.maxUses} max` : ''} · ${expired ? '🔴 Expiré' : (p.active ? '🟢 Actif' : '⚪ Désactivé')}</small>
     ${p.expiresAt ? `<small>Expire le ${dm(p.expiresAt)}</small>` : ''}
    </div>
    <div class="aPromoActions">
     <button class="ghost small" data-promo-toggle="${p.code}">${p.active ? 'Désactiver' : 'Activer'}</button>
     <button class="ghost small danger solid" data-promo-delete="${p.code}">Supprimer</button>
    </div>
   </div>`;
  }).join('') || `<p class="aEmpty">Aucun code promo pour le moment.</p>`}</div>
  <div class="aBox"><h3>Créer un code promo</h3>
   <form id="addPromo">
    <input name="code" placeholder="Code (ex: WELCOME10)" required maxlength="30">
    <div class="two">
     <select name="type">
      <option value="percent">Pourcentage (%)</option>
      <option value="fixed">Montant fixe (€)</option>
     </select>
     <input name="value" type="number" step="0.01" min="0" placeholder="Valeur" required>
    </div>
    <div class="two">
     <input name="minSubtotal" type="number" step="0.01" min="0" placeholder="Minimum panier (€, optionnel)">
     <input name="maxUses" type="number" step="1" min="1" placeholder="Nb d'utilisations max (optionnel)">
    </div>
    <label>Date d'expiration (optionnel)<input name="expiresAt" type="date"></label>
    <button class="cta small" type="submit">CRÉER LE CODE</button>
   </form>
  </div>`;
}

// ---------- Menu (catalogue) ----------
function slugifyClient(s) {
  return String(s).toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';
}
// Les photos restent celles déjà présentes sur le site (pas d'upload) : le champ
// suggère les images déjà utilisées par un produit du catalogue, mais reste un texte
// libre pour pouvoir saisir un chemin qui n'est encore utilisé par aucun produit
// (ex. une image tout juste ajoutée au dépôt).
function imageOptions(current) {
  const set = new Set((AS.menu?.products || []).map(p => p.img));
  if (current) set.add(current);
  return [...set].sort().map(src => `<option value="${src}">${src}</option>`).join('');
}
// Bases/sauces/ingrédients des configurateurs édités en texte, une option par ligne
// ("Nom;supplément" ou "Nom;prix") — plus simple et plus fiable qu'un formulaire à
// lignes dynamiques pour ce genre de petites listes.
function linesToOptions(text, key) {
  return String(text || '').split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const [name, val] = line.split(';').map(s => (s || '').trim());
    const num = Math.max(0, Number(val) || 0);
    const id = slugifyClient(name);
    return key === 'extra' ? { id, name, extra: num } : { id, name, price: num };
  });
}
function optionsToLines(list, key) {
  return (list || []).map(o => `${o.name};${o[key]}`).join('\n');
}

// ---------- Sélecteur visuel d'images (depuis le dépôt GitHub) ----------
// Le champ Photo reste un texte libre (voir imageOptions), mais ce sélecteur permet
// de parcourir en vignettes tout ce qui existe réellement dans public/images/ sur
// GitHub — y compris une image tout juste poussée, avant même que le site ne soit
// redéployé — plutôt que de devoir taper le chemin à la main.
const GITHUB_REPO = 'deen-tag/mondi-food';
const GITHUB_BRANCH = 'main';
let githubImagesCache = null; // caché en mémoire le temps de la session admin

async function fetchGithubImages(force) {
  if (githubImagesCache && !force) return githubImagesCache;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`);
  if (!res.ok) throw new Error(res.status === 403 ? 'Limite de requêtes GitHub atteinte, réessaie dans un instant.' : `Impossible de contacter GitHub (${res.status})`);
  const data = await res.json();
  const exts = /\.(png|jpe?g|webp|gif)$/i;
  githubImagesCache = (data.tree || [])
    .filter(e => e.type === 'blob' && e.path.startsWith('public/images/') && exts.test(e.path))
    .map(e => ({
      sitePath: '/' + e.path.replace(/^public\//, ''),
      name: e.path.split('/').pop(),
      raw: `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${e.path}`,
    }))
    .sort((a, b) => a.sitePath.localeCompare(b.sitePath));
  return githubImagesCache;
}

function closeImagePicker() {
  document.querySelector('#imgPickerOverlay')?.remove();
}

async function openImagePicker(onPick) {
  closeImagePicker();
  const overlay = document.createElement('div');
  overlay.id = 'imgPickerOverlay';
  overlay.className = 'aModalOverlay';
  overlay.innerHTML = `<div class="aModal">
    <div class="aModalHead"><b>Choisir une image (GitHub)</b><button type="button" class="ghost small" id="imgPickerClose">Fermer</button></div>
    <input id="imgPickerSearch" placeholder="Rechercher un fichier…" class="aModalSearch">
    <div id="imgPickerGrid" class="aImgGrid"><p class="aEmpty">Chargement depuis GitHub…</p></div>
    <button type="button" class="ghost small" id="imgPickerRefresh">Actualiser depuis GitHub</button>
   </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeImagePicker(); });
  overlay.querySelector('#imgPickerClose').addEventListener('click', closeImagePicker);

  function renderGrid(images, filter) {
    const grid = overlay.querySelector('#imgPickerGrid');
    const q = (filter || '').toLowerCase();
    const filtered = images.filter(i => i.sitePath.toLowerCase().includes(q));
    if (!filtered.length) { grid.innerHTML = '<p class="aEmpty">Aucune image trouvée.</p>'; return; }
    grid.innerHTML = filtered.map(i => `<button type="button" class="aImgTile" data-pick="${i.sitePath}" title="${i.sitePath}">
      <img src="${i.raw}" loading="lazy" alt="${i.name}"><small>${i.name}</small>
     </button>`).join('');
    grid.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
      onPick(b.dataset.pick);
      closeImagePicker();
    }));
  }

  async function load(force) {
    try {
      const images = await fetchGithubImages(force);
      renderGrid(images, overlay.querySelector('#imgPickerSearch').value);
    } catch (err) {
      overlay.querySelector('#imgPickerGrid').innerHTML = `<p class="aEmpty">${err.message || 'Erreur de chargement.'}</p>`;
    }
  }
  overlay.querySelector('#imgPickerSearch').addEventListener('input', e => {
    if (githubImagesCache) renderGrid(githubImagesCache, e.target.value);
  });
  overlay.querySelector('#imgPickerRefresh').addEventListener('click', () => load(true));
  load(false);
}

function menuView() {
  if (!AS.menu) return `<p class="aEmpty">Chargement du menu…</p>`;
  const tabs = [['categories', 'Catégories'], ['products', 'Produits'], ['builder', 'Compose ta recette'], ['settings', 'Réglages']];
  return `<h1 class="aTitle">MENU</h1>
  <div class="aFilters">${tabs.map(([k, l]) => `<button data-menu-sub="${k}" class="${AS.menuSub === k ? 'active' : ''}">${l}</button>`).join('')}</div>
  ${AS.menuSub === 'categories' ? menuCategoriesView() : ''}
  ${AS.menuSub === 'products' ? menuProductsView() : ''}
  ${AS.menuSub === 'builder' ? menuBuilderView() : ''}
  ${AS.menuSub === 'settings' ? menuSettingsView() : ''}`;
}

function categoryRow(c) {
  return `<div class="aDriverCard">
    <div><b>${c.label}</b><small>${c.kind === 'configurator' ? 'Configurateur' : 'Produits'} · ${(c.sites || []).map(s => s === 'main' ? 'Site principal' : 'Mondi Night').join(', ')}${c.active === false ? ' · Désactivée' : ''}</small></div>
    <div class="aPromoActions">
     <button class="ghost small" data-cat-toggle="${c.slug}">${c.active === false ? 'Activer' : 'Désactiver'}</button>
     <button class="ghost small" data-cat-edit="${c.slug}">Modifier</button>
     <button class="ghost small danger solid" data-cat-delete="${c.slug}">Supprimer</button>
    </div>
   </div>`;
}

function menuCategoriesView() {
  const editingSlug = AS.menuForm?.kind === 'category' ? AS.menuForm.data.slug : null;
  const creating = AS.menuForm?.kind === 'category' && !editingSlug;
  const newBox = `<div class="aBox">${creating ? categoryFormHtml(AS.menuForm.data) : `<button class="cta small" data-cat-new>+ AJOUTER UNE CATÉGORIE</button> <button class="ghost small" data-menu-sync>Synchroniser les catégories/produits du code</button>`}</div>`;
  const list = AS.menu.categories.slice().sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => categoryRow(c) + (editingSlug === c.slug ? categoryFormHtml(AS.menuForm.data) : '')).join('') || `<p class="aEmpty">Aucune catégorie.</p>`;
  return `${newBox}<div class="aDrivers">${list}</div>`;
}

function categoryFormHtml(d) {
  const editing = !!d.slug;
  const sites = d.sites || ['main'];
  return `<div class="aBox">
   <h3>${editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
   <form id="categoryForm">
    <label>Nom<input name="label" required maxlength="60" value="${d.label || ''}"></label>
    <label>Type
     <select name="kind">
      <option value="products" ${d.kind !== 'configurator' ? 'selected' : ''}>Liste de produits</option>
      <option value="configurator" ${d.kind === 'configurator' ? 'selected' : ''}>Configurateur (compose ta recette)</option>
     </select>
    </label>
    <label class="checkRow"><input type="checkbox" name="siteMain" ${sites.includes('main') ? 'checked' : ''}> Visible sur le site principal</label>
    <label class="checkRow"><input type="checkbox" name="siteNight" ${sites.includes('night') ? 'checked' : ''}> Visible sur Mondi Night</label>
    <div class="aRow">
     <button class="cta small" type="submit">${editing ? 'ENREGISTRER' : 'CRÉER'}</button>
     <button type="button" class="ghost small" id="cancelMenuForm">Annuler</button>
    </div>
   </form>
  </div>`;
}

function productRow(p) {
  return `<div class="aDriverCard aProdCard">
    <div class="prodThumb"><img src="${p.img}" alt="" loading="lazy"></div>
    <div><b>${p.name}</b><small>${formatPrice(p.price)}${p.popular ? ' · ⭐ Populaire' : ''}${p.active === false ? ' · Masqué' : ''}</small></div>
    <div class="aPromoActions">
     <button class="ghost small" data-prod-toggle="${p.id}">${p.active === false ? 'Afficher' : 'Masquer'}</button>
     <button class="ghost small" data-prod-edit="${p.id}">Modifier</button>
     <button class="ghost small danger solid" data-prod-delete="${p.id}">Supprimer</button>
    </div>
   </div>`;
}

function menuProductsView() {
  const cats = AS.menu.categories.filter(c => c.kind === 'products').slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const filter = AS.menuProductFilter;
  const editingId = AS.menuForm?.kind === 'product' ? AS.menuForm.data.id : null;
  const creating = AS.menuForm?.kind === 'product' && !editingId;
  const newBox = `<div class="aBox">${creating ? productFormHtml(AS.menuForm.data) : (cats.length ? `<button class="cta small" data-prod-new>+ AJOUTER UN PRODUIT</button>` : `<p class="aMuted">Crée d'abord une catégorie de type "Liste de produits".</p>`)}</div>`;
  // Groupé par catégorie (dans l'ordre du site) plutôt que mélangé : plus facile à
  // s'y retrouver quand il y a des pizzas, boissons et desserts ensemble. Le
  // formulaire d'édition s'affiche juste sous le produit cliqué, pas en bas de page.
  const visibleCats = filter === 'all' ? cats : cats.filter(c => c.slug === filter);
  const groups = visibleCats.map(c => {
    const products = AS.menu.products.filter(p => p.categoryId === c.slug).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!products.length) return '';
    const rows = products.map(p => productRow(p) + (editingId === p.id ? productFormHtml(AS.menuForm.data) : '')).join('');
    return `<h3 class="aGroupTitle">${c.label} <em>${products.length}</em></h3><div class="aDrivers">${rows}</div>`;
  }).join('') || `<p class="aEmpty">Aucun produit dans cette catégorie.</p>`;
  return `${newBox}
  <div class="aToolbar"><select id="menuProductFilter">
   <option value="all" ${filter === 'all' ? 'selected' : ''}>Toutes les catégories</option>
   ${cats.map(c => `<option value="${c.slug}" ${filter === c.slug ? 'selected' : ''}>${c.label}</option>`).join('')}
  </select></div>
  ${groups}`;
}

function productFormHtml(d) {
  const editing = !!d.id;
  const cats = AS.menu.categories.filter(c => c.kind === 'products');
  return `<div class="aBox">
   <h3>${editing ? 'Modifier le produit' : 'Nouveau produit'}</h3>
   <form id="productForm">
    <label>Catégorie
     <select name="categoryId" required>${cats.map(c => `<option value="${c.slug}" ${d.categoryId === c.slug ? 'selected' : ''}>${c.label}</option>`).join('')}</select>
    </label>
    <label>Nom<input name="name" required maxlength="100" value="${d.name || ''}"></label>
    <label>Prix (€)<input name="price" type="number" step="0.01" min="0" required value="${d.price ?? ''}"></label>
    <label>Description<textarea name="desc" rows="2" maxlength="300">${d.desc || ''}</textarea></label>
    <label>Photo
     <div class="aImgFieldRow">
      <input name="img" list="imgOptions" value="${d.img || ''}" placeholder="/images/night/burger-bacon.png">
      <button type="button" class="ghost small" data-pick-img>Parcourir GitHub</button>
     </div>
     <datalist id="imgOptions">${imageOptions(d.img)}</datalist>
    </label>
    <div class="two">
     <label>Badge (optionnel)<input name="badge" maxlength="40" placeholder="Ex. SIGNATURE" value="${d.badge || ''}"></label>
     <label>Tag / filtre (optionnel)<input name="tag" maxlength="40" placeholder="Ex. Classiques" value="${d.tag || ''}"></label>
    </div>
    <div class="two">
     <label class="checkRow"><input type="checkbox" name="hot" ${d.hot ? 'checked' : ''}> Épicé</label>
     <label class="checkRow"><input type="checkbox" name="veg" ${d.veg ? 'checked' : ''}> Végétarien</label>
    </div>
    <label class="checkRow"><input type="checkbox" name="popular" ${d.popular ? 'checked' : ''}> ⭐ Populaire <small class="aMuted">— affiche une pastille sur la carte et met ce produit en avant dans "Nos incontournables" sur la page d'accueil</small></label>
    <div class="aRow">
     <button class="cta small" type="submit">${editing ? 'ENREGISTRER' : 'CRÉER'}</button>
     <button type="button" class="ghost small" id="cancelMenuForm">Annuler</button>
    </div>
   </form>
  </div>`;
}

function menuBuilderView() {
  const list = AS.menu.configurators;
  if (!list.length) return `<p class="aEmpty">Aucun configurateur "Compose ta recette".</p>`;
  return list.map(cfg => `<div class="aBox">
   <h3>${cfg.label}${cfg.active === false ? ' (désactivé)' : ''}</h3>
   <form class="cfgForm" data-cfg="${cfg.id}">
    <label>Nom affiché<input name="label" required maxlength="60" value="${cfg.label}"></label>
    <label>Prix de base (€)<input name="basePrice" type="number" step="0.01" min="0" required value="${cfg.basePrice}"></label>
    <label class="checkRow"><input type="checkbox" name="active" ${cfg.active !== false ? 'checked' : ''}> Configurateur actif (visible sur le site)</label>
    <label>Bases <small class="aMuted">— une par ligne, format "Nom;supplément en €"</small><textarea name="bases" rows="3">${optionsToLines(cfg.bases, 'extra')}</textarea></label>
    <label>Sauces <small class="aMuted">— une par ligne, format "Nom;supplément en €"</small><textarea name="sauces" rows="3">${optionsToLines(cfg.sauces, 'extra')}</textarea></label>
    <label>Ingrédients <small class="aMuted">— un par ligne, format "Nom;prix en €"</small><textarea name="ingredients" rows="8">${optionsToLines(cfg.ingredients, 'price')}</textarea></label>
    <button class="cta small" type="submit">ENREGISTRER</button>
   </form>
  </div>`).join('');
}

function menuSettingsView() {
  const s = AS.menu.settings || {};
  const op = s.optionPrices || {};
  return `<div class="aBox">
   <h3>Livraison</h3>
   <form id="settingsForm">
    <div class="two">
     <label>Frais de livraison (€)<input name="deliveryFee" type="number" step="0.01" min="0" value="${s.deliveryFee ?? 2.5}"></label>
     <label>Livraison offerte dès (€)<input name="freeDeliveryThreshold" type="number" step="0.01" min="0" value="${s.freeDeliveryThreshold ?? 25}"></label>
    </div>
    <h3>Options payantes (fiche produit)</h3>
    <div class="two">
     <label>Fromage supplémentaire (€)<input name="cheese" type="number" step="0.01" min="0" value="${op['Fromage supplémentaire'] ?? 1}"></label>
     <label>Base épicée (€)<input name="spicy" type="number" step="0.01" min="0" value="${op['Base épicée'] ?? 0.5}"></label>
    </div>
    <button class="cta small" type="submit">ENREGISTRER</button>
   </form>
  </div>`;
}

// ---------- Historique ----------
function historyView() {
  const all = AS.orders;
  const today = all.filter(o => isToday(o.createdAt));
  const yesterday = all.filter(o => isYesterday(o.createdAt));
  const week = all.filter(o => isThisWeek(o.createdAt));
  const gs = AS.globalStats;
  return `
  <h1 class="aTitle">HISTORIQUE</h1>
  <div class="aStats">
   <div><b>${today.length}</b><small>Aujourd'hui</small></div>
   <div><b>${yesterday.length}</b><small>Hier</small></div>
   <div><b>${week.length}</b><small>Cette semaine</small></div>
   <div><b>${gs ? gs.totalOrders : '…'}</b><small>Total (depuis toujours)</small></div>
  </div>
  ${gs ? `<div class="aStats"><div><b>${formatPrice(gs.totalRevenue)}</b><small>Chiffre d'affaires total</small></div></div>` : ''}
  <div class="aHistList">${all.map(o => `
   <div class="aHistRow" data-open="${o.id}">
    <span>#${o.orderId || o.id}</span><span>${dm(o.createdAt)} ${hm(o.createdAt)}</span><span>${o.firstName || ''}</span>
    <b>${formatPrice(o.total)}</b><span class="statusChip ${o.status}">${statusIcon(o.status)}</span>
   </div>`).join('') || `<p class="aEmpty">Aucune commande pour le moment.</p>`}</div>`;
}

// ---------- Actions (toutes passent par l'API, jamais d'écriture directe) ----------
async function accept(id) {
  const input = document.querySelector('#prepInput');
  const min = input ? Math.max(1, +input.value || 15) : 15;
  const readyAt = new Date(Date.now() + min * 60000).toISOString();
  await api(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'preparing', prepEstimate: min, readyAt }) });
  refresh();
}
async function ready(id) {
  await api(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'delivering' }) });
  refresh();
}
async function assign(id) {
  const sel = document.querySelector('#driverSelect');
  if (!sel) return;
  await api(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ driverId: sel.value, deliveryStartedAt: new Date().toISOString() }) });
  refresh();
}
async function delivered(id) {
  const o = AS.orders.find(x => x.id === id);
  const patch = { status: 'delivered', deliveredAt: new Date().toISOString() };
  if (o?.paymentStatus === 'attente') patch.paymentStatus = 'paye';
  await api(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  refresh();
}
async function cancelOrder(id) {
  const sel = document.querySelector('#cancelReason');
  const reason = sel ? sel.value : 'Autre';
  await api(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled', cancelReason: reason }) });
  refresh();
}
async function deleteOrder(id) {
  if (!confirm('Supprimer définitivement cette commande ? Cette action est irréversible.')) return;
  await api(`/api/orders/${id}`, { method: 'DELETE' });
  AS.view = 'dashboard'; AS.selected = null;
  refresh();
}

function bind() {
  document.querySelector('[data-toggle-push]')?.addEventListener('click', () => {
    AS.pushSubscribed ? unsubscribeFromPush() : subscribeToPush();
  });
  document.querySelector('[data-logout]')?.addEventListener('click', async () => {
    await api('/api/admin-auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }) }); AS.authed = false; renderRoot();
  });
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
    AS.view = b.dataset.view; AS.selected = null; renderRoot();
    if (AS.view === 'history') loadGlobalStats();
    if (AS.view === 'menu') loadMenu();
  }));
  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { AS.filter = b.dataset.filter; renderRoot(); }));
  document.querySelectorAll('[data-open]').forEach(el => el.addEventListener('click', () => { AS.selected = el.dataset.open; AS.view = 'order'; renderRoot(); }));
  document.querySelector('#aSearch')?.addEventListener('input', e => { AS.search = e.target.value; renderRoot(); });

  document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    const id = b.dataset.id, act = b.dataset.act;
    try {
      if (act === 'open') { AS.selected = id; AS.view = 'order'; renderRoot(); }
      else if (act === 'accept') await accept(id);
      else if (act === 'ready') await ready(id);
      else if (act === 'assign') await assign(id);
      else if (act === 'delivered') await delivered(id);
      else if (act === 'cancel') await cancelOrder(id);
      else if (act === 'delete') await deleteOrder(id);
      else if (act === 'markPaid') { await api(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ paymentStatus: 'paye' }) }); refresh(); }
      else if (act === 'markFailed') { await api(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ paymentStatus: 'echoue' }) }); refresh(); }
    } catch (err) { alert(err.message || 'Erreur'); }
  }));

  document.querySelectorAll('[data-driver-toggle]').forEach(b => b.addEventListener('click', async () => {
    const d = AS.drivers.find(x => x.id === b.dataset.driverToggle);
    try {
      await api(`/api/drivers/${d.id}`, { method: 'PATCH', body: JSON.stringify({ status: d.status === 'pause' ? 'dispo' : 'pause' }) });
      refresh();
    } catch (err) { alert(err.message || 'Erreur'); }
  }));
  document.querySelector('#addDriver')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = new FormData(e.target).get('name');
    try { await api('/api/drivers', { method: 'POST', body: JSON.stringify({ name }) }); refresh(); }
    catch (err) { alert(err.message || 'Erreur'); }
  });

  document.querySelectorAll('[data-promo-toggle]').forEach(b => b.addEventListener('click', async () => {
    try {
      await api('/api/orders', { method: 'POST', body: JSON.stringify({ action: 'promo-toggle', code: b.dataset.promoToggle }) });
      refresh();
    } catch (err) { alert(err.message || 'Erreur'); }
  }));
  document.querySelectorAll('[data-promo-delete]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm(`Supprimer le code ${b.dataset.promoDelete} ?`)) return;
    try {
      await api('/api/orders', { method: 'POST', body: JSON.stringify({ action: 'promo-delete', code: b.dataset.promoDelete }) });
      refresh();
    } catch (err) { alert(err.message || 'Erreur'); }
  }));
  document.querySelector('#addPromo')?.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
      await api('/api/orders', { method: 'POST', body: JSON.stringify({ action: 'promo-create', ...d }) });
      refresh();
    } catch (err) { alert(err.message || 'Erreur'); }
  });

  // ---- Menu ----
  document.querySelectorAll('[data-menu-sub]').forEach(b => b.addEventListener('click', () => {
    AS.menuSub = b.dataset.menuSub; AS.menuForm = null; renderRoot();
  }));
  document.querySelector('#menuProductFilter')?.addEventListener('change', e => {
    AS.menuProductFilter = e.target.value; renderRoot();
  });
  document.querySelector('#cancelMenuForm')?.addEventListener('click', () => { AS.menuForm = null; renderRoot(); });
  document.querySelector('[data-pick-img]')?.addEventListener('click', () => {
    openImagePicker(path => {
      const input = document.querySelector('#categoryForm [name="img"], #productForm [name="img"]');
      if (input) input.value = path;
    });
  });

  function openMenuForm() {
    renderRoot();
    document.querySelector('#categoryForm, #productForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.querySelector('[data-cat-new]')?.addEventListener('click', () => {
    AS.menuForm = { kind: 'category', data: { sites: ['main'], kind: 'products' } }; openMenuForm();
  });
  document.querySelector('[data-menu-sync]')?.addEventListener('click', async (e) => {
    const btn = e.target; btn.disabled = true; btn.textContent = 'Synchronisation…';
    try {
      const r = await api('/api/menu', { method: 'POST', body: JSON.stringify({ resource: 'sync', action: 'defaults' }) });
      const total = r.addedCategories.length + r.addedProducts.length;
      alert(total ? `Ajouté : ${[...r.addedCategories, ...r.addedProducts].join(', ')}` : 'Rien à ajouter, tout est déjà présent.');
      await loadMenu(true);
    } catch (err) {
      alert(err.message || 'Erreur lors de la synchronisation.');
      btn.disabled = false; btn.textContent = 'Synchroniser les catégories/produits du code';
    }
  });
  document.querySelectorAll('[data-cat-edit]').forEach(b => b.addEventListener('click', () => {
    const c = AS.menu.categories.find(x => x.slug === b.dataset.catEdit);
    AS.menuForm = { kind: 'category', data: { ...c } }; openMenuForm();
  }));
  document.querySelectorAll('[data-cat-toggle]').forEach(b => b.addEventListener('click', async () => {
    const c = AS.menu.categories.find(x => x.slug === b.dataset.catToggle);
    try {
      await api('/api/menu', { method: 'POST', body: JSON.stringify({ resource: 'category', action: 'update', slug: c.slug, active: c.active === false }) });
      await loadMenu(true);
    } catch (err) { alert(err.message || 'Erreur'); }
  }));
  document.querySelectorAll('[data-cat-delete]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await api('/api/menu', { method: 'POST', body: JSON.stringify({ resource: 'category', action: 'delete', slug: b.dataset.catDelete }) });
      await loadMenu(true);
    } catch (err) { alert(err.message || 'Erreur'); }
  }));
  document.querySelector('#categoryForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const editing = AS.menuForm?.data?.slug;
    const sites = [d.siteMain ? 'main' : null, d.siteNight ? 'night' : null].filter(Boolean);
    if (!sites.length) { alert('Choisis au moins un site (principal et/ou Mondi Night).'); return; }
    try {
      await api('/api/menu', { method: 'POST', body: JSON.stringify({ resource: 'category', action: editing ? 'update' : 'create', slug: editing, label: d.label, kind: d.kind, sites }) });
      AS.menuForm = null; await loadMenu(true);
    } catch (err) { alert(err.message || 'Erreur'); }
  });

  document.querySelector('[data-prod-new]')?.addEventListener('click', () => {
    const firstCat = AS.menu.categories.find(c => c.kind === 'products');
    AS.menuForm = { kind: 'product', data: { categoryId: AS.menuProductFilter !== 'all' ? AS.menuProductFilter : firstCat?.slug, active: true } }; openMenuForm();
  });
  document.querySelectorAll('[data-prod-edit]').forEach(b => b.addEventListener('click', () => {
    const p = AS.menu.products.find(x => x.id === b.dataset.prodEdit);
    AS.menuForm = { kind: 'product', data: { ...p } }; openMenuForm();
  }));
  document.querySelectorAll('[data-prod-toggle]').forEach(b => b.addEventListener('click', async () => {
    const p = AS.menu.products.find(x => x.id === b.dataset.prodToggle);
    try {
      await api('/api/menu', { method: 'POST', body: JSON.stringify({ resource: 'product', action: 'update', id: p.id, active: p.active === false }) });
      await loadMenu(true);
    } catch (err) { alert(err.message || 'Erreur'); }
  }));
  document.querySelectorAll('[data-prod-delete]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Supprimer définitivement ce produit ?')) return;
    try {
      await api('/api/menu', { method: 'POST', body: JSON.stringify({ resource: 'product', action: 'delete', id: b.dataset.prodDelete }) });
      await loadMenu(true);
    } catch (err) { alert(err.message || 'Erreur'); }
  }));
  document.querySelector('#productForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const editing = AS.menuForm?.data?.id;
    try {
      await api('/api/menu', {
        method: 'POST',
        body: JSON.stringify({
          resource: 'product', action: editing ? 'update' : 'create', id: editing,
          categoryId: d.categoryId, name: d.name, price: Number(d.price), desc: d.desc,
          img: d.img, badge: d.badge || null, tag: d.tag || null, hot: !!d.hot, veg: !!d.veg, popular: !!d.popular,
        }),
      });
      AS.menuForm = null; await loadMenu(true);
    } catch (err) { alert(err.message || 'Erreur'); }
  });

  document.querySelectorAll('.cfgForm').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    try {
      await api('/api/menu', {
        method: 'POST',
        body: JSON.stringify({
          resource: 'configurator', action: 'update', id: f.dataset.cfg,
          label: d.label, basePrice: Number(d.basePrice), active: !!d.active,
          bases: linesToOptions(d.bases, 'extra'), sauces: linesToOptions(d.sauces, 'extra'), ingredients: linesToOptions(d.ingredients, 'price'),
        }),
      });
      await loadMenu(true);
      alert('Configurateur mis à jour.');
    } catch (err) { alert(err.message || 'Erreur'); }
  }));

  document.querySelector('#settingsForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
      await api('/api/menu', {
        method: 'POST',
        body: JSON.stringify({
          resource: 'settings', action: 'update',
          deliveryFee: Number(d.deliveryFee), freeDeliveryThreshold: Number(d.freeDeliveryThreshold),
          optionPrices: { 'Fromage supplémentaire': Number(d.cheese), 'Base épicée': Number(d.spicy) },
        }),
      });
      await loadMenu(true);
      alert('Réglages enregistrés.');
    } catch (err) { alert(err.message || 'Erreur'); }
  });
}

setInterval(() => { if (AS.authed && AS.view === 'dashboard') pingCheck(); }, 15000);
init();
