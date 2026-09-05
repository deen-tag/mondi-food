import webpush from 'web-push';
import crypto from 'crypto';
import { getFirestore } from './_firebase.js';

// Identifiant de document Firestore dérivé de l'endpoint (l'endpoint contient des
// caractères interdits dans un ID de doc, ex: '/'), donc on le hash.
export function subKeyId(endpoint) {
  return crypto.createHash('sha256').update(endpoint).digest('hex');
}

let configured = false;
let vapidBroken = false;
function ensureVapid() {
  if (configured) return true;
  if (vapidBroken) return false; // déjà tenté et échoué, on n'insiste pas à chaque commande
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    configured = true;
    return true;
  } catch (err) {
    // Ex: VAPID_SUBJECT mal formé (doit être "mailto:..." ou une URL "https://...").
    // On log l'erreur mais on ne doit JAMAIS empêcher une commande d'être créée
    // à cause d'un souci de config des notifs.
    console.error('Configuration VAPID invalide, notifs push désactivées:', err.message);
    vapidBroken = true;
    return false;
  }
}

// Envoie une notif push à tous les appareils admin abonnés. Ne bloque jamais le
// reste de la requête en cas d'erreur : si VAPID n'est pas configuré (variables
// d'env absentes ou invalides), on ignore silencieusement — la commande est créée
// normalement, juste sans notif push.
export async function sendPushToAll(payload) {
  try {
    if (!ensureVapid()) return;
    const db = getFirestore();
    const snap = await db.collection('pushSubscriptions').get();
    if (snap.empty) return;
    const body = JSON.stringify(payload);
    await Promise.all(snap.docs.map(async (doc) => {
      try {
        await webpush.sendNotification(doc.data(), body);
      } catch (err) {
        // 404/410 = l'abonnement n'existe plus côté navigateur (désinstallation,
        // permission révoquée, etc.) -> on nettoie pour ne pas réessayer indéfiniment.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await doc.ref.delete().catch(() => {});
        } else {
          console.error('Erreur envoi push:', err.message);
        }
      }
    }));
  } catch (err) {
    console.error('Erreur sendPushToAll:', err.message);
  }
}
