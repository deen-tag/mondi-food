import { getFirestore } from './_firebase.js';
import { requireAdmin } from './_admin-auth.js';
import { subKeyId } from './_push.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // La clé publique VAPID n'est pas secrète (contrairement à la clé privée,
    // utilisée uniquement côté serveur dans _push.js) : elle sert au navigateur
    // à créer son abonnement push.
    return res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
  }

  if (!requireAdmin(req, res)) return;
  const db = getFirestore();

  if (req.method === 'POST') {
    const sub = req.body?.subscription;
    if (!sub?.endpoint) return res.status(400).json({ error: 'Abonnement invalide' });
    await db.collection('pushSubscriptions').doc(subKeyId(sub.endpoint)).set(sub);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const endpoint = req.body?.endpoint;
    if (endpoint) await db.collection('pushSubscriptions').doc(subKeyId(endpoint)).delete().catch(() => {});
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
