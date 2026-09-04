import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore as _getFirestore } from 'firebase-admin/firestore';

// La clé de service Firebase est stockée en une seule variable d'environnement
// (le JSON complet du fichier téléchargé depuis Firebase Console), jamais commitée.
function initFirebase() {
  if (getApps().length) return;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}

export function getFirestore() {
  initFirebase();
  return _getFirestore();
}
