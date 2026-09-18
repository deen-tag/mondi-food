import { requireAdmin } from './_admin-auth.js';
import {
  getCatalog,
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  updateConfigurator,
  updateSettings,
} from './_menu-store.js';

// Un seul fichier serverless pour tout le menu (public + admin), pour rester sous
// la limite de 12 fonctions du plan Vercel Hobby (voir api/admin-auth.js) :
//
//   GET  /api/menu                                     -> catalogue complet, public
//                                                          (utilisé par le site, Mondi Night, et l'admin)
//   POST /api/menu   { resource, action, ...payload }  -> écritures, réservées à l'admin
//
//     resource: 'category'      action: 'create' | 'update' | 'delete'
//     resource: 'product'       action: 'create' | 'update' | 'delete'
//     resource: 'configurator'  action: 'update'
//     resource: 'settings'      action: 'update'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const catalog = await getCatalog();
      return res.status(200).json(catalog);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Impossible de charger le menu' });
    }
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const { resource, action, ...payload } = req.body || {};

    try {
      if (resource === 'category') {
        if (action === 'create') return res.status(200).json(await createCategory(payload));
        if (action === 'update') return res.status(200).json(await updateCategory(payload.slug, payload));
        if (action === 'delete') {
          await deleteCategory(payload.slug);
          return res.status(200).json({ ok: true });
        }
      }

      if (resource === 'product') {
        if (action === 'create') return res.status(200).json(await createProduct(payload));
        if (action === 'update') return res.status(200).json(await updateProduct(payload.id, payload));
        if (action === 'delete') {
          await deleteProduct(payload.id);
          return res.status(200).json({ ok: true });
        }
      }

      if (resource === 'configurator' && action === 'update') {
        return res.status(200).json(await updateConfigurator(payload.id, payload));
      }

      if (resource === 'settings' && action === 'update') {
        return res.status(200).json(await updateSettings(payload));
      }

      return res.status(400).json({ error: 'Requête invalide' });
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: err.message || 'Erreur serveur' });
    }
  }

  return res.status(405).end();
}
