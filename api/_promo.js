import { getFirestore } from './_firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

// Codes promo — logique 100% côté serveur, jamais confiance au client.
// Un document Firestore par code, id = code en majuscules (ex: "WELCOME10").
//
// Champs du document :
//   type       'percent' | 'fixed'   (pourcentage ou montant fixe en euros)
//   value      number                (ex: 10 pour -10%, ou 5 pour -5€)
//   active     boolean               (l'admin peut désactiver sans supprimer)
//   minSubtotal number               (sous-total minimum requis, 0 = aucun minimum)
//   maxUses    number | null         (null = illimité)
//   usedCount  number                (compteur, incrémenté à chaque commande validée)
//   createdAt  ISO string

export function normalizeCode(raw) {
  return String(raw || '').trim().toUpperCase().slice(0, 30);
}

// Calcule la réduction pour un code + un sous-total donnés. Ne modifie rien en base
// (utilisé à la fois pour la prévisualisation client et juste avant la création réelle
// de la commande). Lance une Error avec un message adapté à l'affichage client si invalide.
export async function checkPromoCode(db, rawCode, subtotal) {
  const code = normalizeCode(rawCode);
  if (!code) throw new Error('Code promo manquant');

  const ref = db.collection('promoCodes').doc(code);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Code promo invalide');

  const p = snap.data();
  if (!p.active) throw new Error('Ce code promo n’est plus actif');
  if (p.maxUses != null && (p.usedCount || 0) >= p.maxUses) {
    throw new Error('Ce code promo a atteint sa limite d’utilisation');
  }
  if (p.minSubtotal && subtotal < p.minSubtotal) {
    throw new Error(`Ce code nécessite un minimum de ${p.minSubtotal.toFixed(2).replace('.', ',')} €`);
  }

  const rawDiscount = p.type === 'percent' ? (subtotal * p.value) / 100 : p.value;
  // La réduction ne peut jamais dépasser le sous-total (pas de total négatif).
  const discount = Math.round(Math.min(rawDiscount, subtotal) * 100) / 100;

  return { code, type: p.type, value: p.value, discount };
}

// À appeler uniquement après confirmation réelle de la commande (création directe pour
// le paiement à la livraison, ou webhook Stripe pour le paiement en ligne) — jamais à la
// simple prévisualisation, pour ne pas décompter un code qu'un client a seulement testé
// sans finaliser sa commande.
export async function consumePromoCode(db, code) {
  try {
    await db.collection('promoCodes').doc(normalizeCode(code)).update({
      usedCount: FieldValue.increment(1),
    });
  } catch (err) {
    // Ne doit jamais faire échouer la commande elle-même si le compteur ne s'incrémente pas.
    console.error('Erreur incrément usage code promo (non bloquant):', err.message);
  }
}
