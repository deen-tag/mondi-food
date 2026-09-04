import { isAdminAuthed } from './_admin-auth.js';

export default async function handler(req, res) {
  return res.status(200).json({ authed: isAdminAuthed(req) });
}
