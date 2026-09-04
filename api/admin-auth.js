import { createSessionCookie, clearSessionCookie, isAdminAuthed } from './_admin-auth.js';

// Fusion de admin-login.js + admin-logout.js + admin-session.js dans un seul
// fichier, pour rester sous la limite de 12 fonctions serverless du plan
// Vercel Hobby. Comportement strictement identique à avant, juste regroupé.
//
//   GET  /api/admin-auth                          -> vérifie la session (ex admin-session.js)
//   POST /api/admin-auth  { action: 'login', password }   -> connexion (ex admin-login.js)
//   POST /api/admin-auth  { action: 'logout' }             -> déconnexion (ex admin-logout.js)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ authed: isAdminAuthed(req) });
  }

  if (req.method === 'POST') {
    const { action, password } = req.body || {};

    if (action === 'logout') {
      res.setHeader('Set-Cookie', clearSessionCookie());
      return res.status(200).json({ ok: true });
    }

    if (action === 'login') {
      if (!password || !process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Mot de passe incorrect' });
      }
      res.setHeader('Set-Cookie', createSessionCookie());
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'action invalide' });
  }

  return res.status(405).end();
}
