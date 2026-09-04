import './admin.css';
import { icon } from './icons.js';

const DS = {
  driverId: sessionStorage.getItem('mf_driver_id') || null,
  drivers: [],
  orders: [],
  doneToday: 0,
  loading: true,
};
const formatPrice = n => (+n).toFixed(2).replace('.', ',') + ' €';
const hm = iso => iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

async function api(path, opts = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

async function loadDrivers() {
  const d = await api('/api/drivers');
  DS.drivers = d.drivers || [];
}
async function loadMyOrders() {
  if (!DS.driverId) return;
  const d = await api(`/api/driver-orders?driverId=${encodeURIComponent(DS.driverId)}`);
  DS.orders = d.orders || [];
  DS.doneToday = d.doneToday || 0;
}

async function refresh() {
  try {
    await loadDrivers();
    if (DS.driverId) await loadMyOrders();
  } catch {}
  DS.loading = false;
  render();
}

function render() {
  const root = document.querySelector('#root');
  const driver = DS.driverId ? DS.drivers.find(d => d.id === DS.driverId) : null;
  if (!driver) { root.innerHTML = pickView(); bindPick(); return; }
  root.innerHTML = DS.loading ? '<p class="aEmpty">Chargement…</p>' : mainView(driver);
  bind(driver);
}

function pickView() {
  return `<div class="adminLogin"><img src="/logo.png"><h1>LIVREUR</h1><p>Qui es-tu ?</p>
  <div class="aDrivers">${DS.drivers.map(d => `<button class="ghost wide" data-pick="${d.id}" style="justify-content:center;margin-bottom:8px;padding:14px">🛵 ${d.name}</button>`).join('') || '<p class="aEmpty">Aucun livreur enregistré — demande à l\'admin de t\'ajouter.</p>'}</div>
  </div>`;
}
function bindPick() {
  document.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
    DS.driverId = b.dataset.pick;
    sessionStorage.setItem('mf_driver_id', DS.driverId);
    DS.loading = true; render(); refresh();
  }));
}

function mainView(driver) {
  const statusLabel = { dispo: '🟢 Disponible', livraison: '🔴 En livraison', pause: '🟡 En pause' };
  return `<div class="admin">
  <header class="aHeader">
   <span class="aLogo">🛵 <b>${driver.name}</b></span>
   <button class="aLogout" data-switch title="Changer de livreur">${icon('close')}</button>
  </header>
  <main>
   <div class="aStats" style="grid-template-columns:1fr 1fr">
    <div><b>${DS.orders.length}</b><small>En cours</small></div>
    <div><b>${DS.doneToday}</b><small>Livrées aujourd'hui</small></div>
   </div>

   ${DS.orders.length === 0 && driver.status !== 'livraison' ? `
   <div class="aBox"><h3>Disponibilité</h3><p class="aMuted">${statusLabel[driver.status]}</p>
    <button class="cta wide" data-toggle>${driver.status === 'pause' ? 'REPRENDRE LES LIVRAISONS' : 'ME METTRE EN PAUSE'}</button>
   </div>` : ''}

   <h2 style="font:800 15px 'Barlow Condensed';letter-spacing:1px;margin:18px 0 10px">🛵 MES LIVRAISONS EN COURS</h2>
   ${DS.orders.length ? `<div class="aCards">${DS.orders.map(deliveryCard).join('')}</div>` : `<p class="aEmpty">Aucune livraison assignée pour le moment.</p>`}
  </main>
  </div>`;
}

function deliveryCard(o) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([o.address, o.zip, o.city].filter(Boolean).join(' '))}`;
  return `<article class="aCard">
  <div class="aCardTop"><b>#${o.orderId || o.id}</b><span>Depuis ${hm(o.deliveryStartedAt)}</span></div>
  <div class="aCardClient">${o.firstName || 'Client'}</div>
  <div class="aCardAddr">📍 ${o.address || ''}${o.zip ? ', ' + o.zip : ''}</div>
  ${o.note ? `<div class="aNote">📝 « ${o.note} »</div>` : ''}
  <div class="aCardBottom"><strong>${formatPrice(o.total)}</strong><span class="payBadge">${o.paymentStatus === 'paye' ? '🟢 PAYÉ' : '🟠 À encaisser'}</span></div>
  <div class="aRow">
   <a class="ghost small" href="tel:${o.phone}">${icon('phone')} Appeler</a>
   <a class="ghost small" href="${mapUrl}" target="_blank" rel="noopener">${icon('location')} Carte</a>
  </div>
  <button class="cta wide" style="margin-top:10px" data-delivered="${o.id}">LIVRÉE ${icon('arrow-right')}</button>
  </article>`;
}

function bind(driver) {
  document.querySelector('[data-switch]')?.addEventListener('click', () => {
    sessionStorage.removeItem('mf_driver_id'); DS.driverId = null; render();
  });
  document.querySelector('[data-toggle]')?.addEventListener('click', async () => {
    try {
      await api('/api/driver-status', { method: 'POST', body: JSON.stringify({ driverId: driver.id, status: driver.status === 'pause' ? 'dispo' : 'pause' }) });
      refresh();
    } catch (err) { alert(err.message || 'Erreur'); }
  });
  document.querySelectorAll('[data-delivered]').forEach(b => b.addEventListener('click', async () => {
    try {
      await api('/api/driver-deliver', { method: 'POST', body: JSON.stringify({ driverId: driver.id, orderId: b.dataset.delivered }) });
      refresh();
    } catch (err) { alert(err.message || 'Erreur'); }
  }));
}

setInterval(refresh, 5000);
refresh();
