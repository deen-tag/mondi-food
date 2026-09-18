// ---------- Toasts & confirmations stylées (remplace alert()/confirm()) ----------
// Un seul point d'entrée : toast(message, type) et confirmModal({...}) → Promise<boolean>.
// Zéro dépendance, s'appuie sur les tokens déjà définis dans admin.css (--p, --card, etc.).
import { icon } from './icons.js';

const TOAST_ICONS = { success: 'check', error: 'warning', warning: 'warning', info: 'info' };
const TOAST_DURATION = { success: 3200, info: 3200, warning: 4200, error: 5000 };

function getToastWrap() {
  let wrap = document.querySelector('.aToastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'aToastWrap';
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('aria-live', 'polite');
    document.body.appendChild(wrap);
  }
  return wrap;
}

/**
 * Affiche un toast temporaire en haut de l'écran.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 */
export function toast(message, type = 'success') {
  const wrap = getToastWrap();
  const el = document.createElement('div');
  el.className = `aToast ${type}`;
  el.innerHTML = `
    <span class="aToastIcon">${icon(TOAST_ICONS[type] || 'info')}</span>
    <span class="aToastMsg"></span>
    <button type="button" class="aToastClose" aria-label="Fermer">${icon('close')}</button>
  `;
  el.querySelector('.aToastMsg').textContent = message; // textContent → jamais d'injection HTML
  wrap.appendChild(el);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400); // filet de sécurité si animationend ne part pas
  };

  el.querySelector('.aToastClose').addEventListener('click', close);
  const timer = setTimeout(close, TOAST_DURATION[type] || 3200);
  el.addEventListener('mouseenter', () => clearTimeout(timer));

  return close;
}

/**
 * Remplace confirm() par une modale cohérente avec le reste de l'admin.
 * @returns {Promise<boolean>} true si l'utilisateur confirme
 */
export function confirmModal({ title = 'Confirmer', message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'aModalOverlay aConfirmOverlay';
    overlay.innerHTML = `
      <div class="aModal aConfirmModal" role="alertdialog" aria-modal="true" aria-labelledby="cfmTitle">
        <div class="aConfirmIcon ${danger ? 'danger' : ''}">${icon(danger ? 'warning' : 'info')}</div>
        <b id="cfmTitle">${title}</b>
        <p class="aConfirmMsg"></p>
        <div class="aConfirmActions">
          <button type="button" class="ghost aConfirmCancel">${cancelLabel}</button>
          <button type="button" class="cta ${danger ? 'danger' : ''} aConfirmOk">${confirmLabel}</button>
        </div>
      </div>
    `;
    overlay.querySelector('.aConfirmMsg').textContent = message || '';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // petit délai pour laisser l'animation CSS d'entrée s'appliquer
    requestAnimationFrame(() => overlay.classList.add('show'));

    const finish = ok => {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      setTimeout(() => overlay.remove(), 180);
      resolve(ok);
    };
    const onKey = e => {
      if (e.key === 'Escape') finish(false);
      if (e.key === 'Enter') finish(true);
    };

    overlay.querySelector('.aConfirmCancel').addEventListener('click', () => finish(false));
    overlay.querySelector('.aConfirmOk').addEventListener('click', () => finish(true));
    overlay.addEventListener('click', e => { if (e.target === overlay) finish(false); });
    document.addEventListener('keydown', onKey);
    overlay.querySelector('.aConfirmOk').focus();
  });
}
