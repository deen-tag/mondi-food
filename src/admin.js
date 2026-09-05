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
  knownNew: new Set(),
  loading: true,
  activeCount: null, // dernier compteur "ping" connu (received+preparing+delivering)
  globalStats: null, // { totalOrders, totalRevenue } depuis toujours, chargé une fois
  pushSubscribed: false, // abonné aux notifs push (Service Worker) ?
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
    const [o, d] = await Promise.all([api('/api/orders'), api('/api/drivers')]);
    AS.orders = o.orders || [];
    AS.drivers = d.drivers || [];
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
  const canAskPush = 'serviceWorker' in navigator && 'PushManager' in window && !AS.pushSubscribed;
  return `<header class="aHeader">
  <span class="aLogo">${icon('fire', '', true)} MONDI FOOD <b>ADMIN</b></span>
  <nav class="aTabs">
   <button data-view="dashboard" class="${AS.view === 'dashboard' ? 'on' : ''}">Dashboard${news ? `<em>${news}</em>` : ''}</button>
   <button data-view="drivers" class="${AS.view === 'drivers' ? 'on' : ''}">Livreurs</button>
   <button data-view="history" class="${AS.view === 'history' ? 'on' : ''}">Historique</button>
  </nav>
  ${canAskPush ? `<button class="aLogout" data-ask-notif title="Activer les notifications push">🔔</button>` : ''}
  <button class="aLogout" data-logout>${icon('close')}</button>
  </header>`;
}

function screen() {
  if (AS.view === 'order') return orderView();
  if (AS.view === 'drivers') return driversView();
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
   <div><b>${news.length}</b><small>Nouvelles</small></div>
   <div><b>${cuisine.length}</b><small>Cuisine</small></div>
   <div><b>${livraison.length}</b><small>Livraison</small></div>
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
    <button class="ghost small danger" data-act="delete" data-id="${o.id}">Supprimer définitivement</button></div>`;

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
  document.querySelector('[data-ask-notif]')?.addEventListener('click', () => subscribeToPush());
  document.querySelector('[data-logout]')?.addEventListener('click', async () => {
    await api('/api/admin-auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }) }); AS.authed = false; renderRoot();
  });
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
    AS.view = b.dataset.view; AS.selected = null; renderRoot();
    if (AS.view === 'history') loadGlobalStats();
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
}

setInterval(() => { if (AS.authed && AS.view === 'dashboard') pingCheck(); }, 15000);
init();
