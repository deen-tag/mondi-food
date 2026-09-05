import webpush from 'web-push';
import crypto from 'crypto';
import { getFirestore } from './_firebase.js';

// Identifiant de document Firestore dérivé de l'endpoint (l'endpoint contient des
// caractères interdits dans un ID de doc, ex: '/'), donc on le hash.
export function subKeyId(endpoint) {
  return crypto.createHash('sha256').update(endpoint).digest('hex');
}

let configured = false;
function ensureVapid() {
  if (configured) return true;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

// Envoie une notif push à tous les appareils admin abonnés. Ne bloque jamais le
// reste de la requête en cas d'erreur : si VAPID n'est pas configuré (variables
// d'env absentes), on ignore silencieusement — la commande est créée normalement,
// juste sans notif push.
export async function sendPushToAll(payload) {
  if (!ensureVapid()) return;
  try {
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
