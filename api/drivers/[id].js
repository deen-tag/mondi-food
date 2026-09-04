import { getFirestore } from '../_firebase.js';
import { requireAdmin } from '../_admin-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end();
  if (!requireAdmin(req, res)) return;
  const { id } = req.query;
  const { status } = req.body || {};
  if (!['dispo', 'pause', 'livraison'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }
  try {
    await getFirestore().collection('drivers').doc(id).update({ status });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Livreur introuvable' });
  }
}
