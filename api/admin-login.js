import { createSessionCookie } from './_admin-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body || {};
  if (!password || !process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }
  res.setHeader('Set-Cookie', createSessionCookie());
  return res.status(200).json({ ok: true });
}
