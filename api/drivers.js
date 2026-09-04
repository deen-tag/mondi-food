import { getFirestore } from './_firebase.js';
import { requireAdmin } from './_admin-auth.js';

export default async function handler(req, res) {
  const db = getFirestore();

  if (req.method === 'GET') {
    // Public : l'écran livreur a besoin de la liste des noms pour que le livreur
    // se choisisse lui-même. Aucune donnée sensible ici (juste prénom + statut).
    const snap = await db.collection('drivers').orderBy('name').get();
    return res.status(200).json({ drivers: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const name = String((req.body || {}).name || '').trim().slice(0, 60);
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const ref = await db.collection('drivers').add({ name, status: 'dispo' });
    return res.status(200).json({ id: ref.id, name, status: 'dispo' });
  }

  return res.status(405).end();
}

