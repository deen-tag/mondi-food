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
import { uploadImageToGithub, deleteImageFromGithub } from './_github.js';

// Vercel bloque les requêtes au-delà d'une certaine taille de corps sur le
// plan Hobby ; on refuse une image trop lourde côté serveur avant l'appel
// GitHub, en plus de la compression déjà faite côté navigateur.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 Mo

function sanitizeFilename(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 60);
}

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

      if (resource === 'image' && action === 'upload') {
        const { filename, dataUrl } = payload;
        const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(dataUrl || '');
        if (!match) return res.status(400).json({ error: "Format d'image invalide (png, jpg ou webp uniquement)" });

        const [, rawExt, base64] = match;
        const approxBytes = base64.length * 0.75;
        if (approxBytes > MAX_IMAGE_BYTES) {
          return res.status(400).json({ error: 'Image trop lourde (4 Mo max).' });
        }

        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
        const safeName = sanitizeFilename(filename?.replace(/\.[^.]+$/, '')) || 'image';
        const path = `public/images/uploads/${Date.now()}-${safeName}.${ext}`;

        const result = await uploadImageToGithub(path, base64);
        return res.status(200).json(result);
      }

      if (resource === 'image' && action === 'delete') {
        const { sitePath } = payload;
        // sitePath vient du sélecteur d'images admin, ex: "/images/uploads/123-photo.png".
        // On ne permet la suppression que dans public/images/, jamais ailleurs dans le repo.
        if (typeof sitePath !== 'string' || !/^\/images\/[^.][^\0]*\.(png|jpe?g|webp|gif)$/i.test(sitePath) || sitePath.includes('..')) {
          return res.status(400).json({ error: 'Chemin d\'image invalide.' });
        }
        const path = `public${sitePath}`;
        await deleteImageFromGithub(path);
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Requête invalide' });
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: err.message || 'Erreur serveur' });
    }
  }

  return res.status(405).end();
}
