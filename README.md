# Food Dark Kitchen — V2 premium

## 📌 Suivi de mise en place (mis à jour au fil de l'avancement)

### ✅ Fait
- Projet Firebase créé : **mondifood** (console.firebase.google.com)
- Base de données **Cloud Firestore** créée (édition Standard, mode production, région eur3)
- Clé de service Firebase générée (fichier JSON téléchargé)
- Variable `FIREBASE_SERVICE_ACCOUNT` ajoutée sur Vercel (contenu du JSON collé)
- Site déployé sur Vercel : **mondi-food.vercel.app**
- Variable `STRIPE_SECRET_KEY` créée sur Vercel (⚠️ valeur pas encore renseignée, voir ci-dessous)

### ⚠️ À faire ensuite (dans l'ordre)
1. **Créer un compte Stripe** sur https://dashboard.stripe.com/register
2. Récupérer la **clé secrète de test** sur https://dashboard.stripe.com/apikeys (commence par `sk_test_...`)
   → la coller comme valeur de `STRIPE_SECRET_KEY` sur Vercel
3. Créer le **webhook Stripe** :
   - dashboard.stripe.com/webhooks → "Ajouter un endpoint"
   - URL : `https://mondi-food.vercel.app/api/stripe-webhook`
   - Événement à écouter : `checkout.session.completed`
   - Copier le "signing secret" (`whsec_...`) donné après création
   - L'ajouter sur Vercel comme nouvelle variable `STRIPE_WEBHOOK_SECRET`
4. **Redéployer** le projet sur Vercel une fois toutes les variables renseignées
   (Deployments → "..." → Redeploy)
5. Tester un paiement en mode test Stripe et vérifier qu'une commande apparaît
   bien dans la collection Firestore `orders`

### 🔐 Sécurité — à ne pas oublier
- La clé privée Firebase (`mondifood-firebase-adminsdk-fbsvc-08ec9bf60a.json`) a été
  manipulée pendant la mise en place et doit être **régénérée puis révoquée** par précaution :
  1. Firebase Console → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée
  2. Mettre à jour la valeur de `FIREBASE_SERVICE_ACCOUNT` sur Vercel avec la nouvelle clé
  3. Révoquer l'ancienne clé dans Google Cloud Console → IAM et administration →
     Comptes de service → `firebase-adminsdk-fbsvc@mondifood...` → onglet Clés → supprimer
     la clé avec l'ID `08ec9bf60a...`
  4. Redéployer sur Vercel
- Ne jamais partager le contenu d'une clé de service (Firebase, Stripe, etc.) en clair,
  même dans un chat ou un outil d'IA — traiter ces fichiers comme des mots de passe.

---


Cette version rapproche volontairement le frontend des maquettes générées :
- identité noir/violet
- typographies Barlow Condensed + Inter
- hero et cartes visuelles
- vraies images issues des maquettes de référence
- navigation mobile
- menu Pizza / Pannuezo
- fiche produit
- panier
- checkout livraison
- choix paiement en ligne / à la livraison
- confirmation et suivi
- localStorage pour le panier

Lancer :
`npm install`
`npm run dev`

## Paiement en ligne (Stripe)
Le paiement en ligne est branché sur **Stripe Checkout** via des fonctions serverless
compatibles Vercel dans `api/` :
- `api/create-checkout-session.js` : recalcule le panier côté serveur (jamais confiance
  aux prix envoyés par le client) et crée une session Stripe Checkout.
- `api/verify-session.js` : vérifie qu'une session est bien payée avant d'afficher la
  confirmation, après le retour depuis Stripe.
- `api/stripe-webhook.js` : reçoit l'événement `checkout.session.completed` envoyé par
  Stripe et enregistre la commande dans Firestore — c'est ce que ton espace admin lira.
- `api/_firebase.js` : initialisation du SDK Firebase Admin (écriture Firestore).
- `api/_menu.js` : copie serveur du catalogue/prix, à garder synchronisée avec `src/main.js`.

### Mise en place — Stripe
1. Créer un compte Stripe et récupérer une clé secrète de test sur
   https://dashboard.stripe.com/apikeys
2. Copier `.env.example` en `.env` et renseigner `STRIPE_SECRET_KEY`
3. `npm install`
4. Déployer sur Vercel (ou tester en local avec `vercel dev`, qui sert à la fois le
   frontend Vite et les fonctions `api/`) et définir `STRIPE_SECRET_KEY` dans les
   variables d'environnement du projet Vercel (jamais commitée, jamais exposée au client)

### Mise en place — Firebase (pour l'espace admin)
1. Créer un projet sur https://console.firebase.google.com, activer **Firestore**
2. Paramètres du projet → Comptes de service → "Générer une nouvelle clé privée"
   (télécharge un fichier JSON)
3. Copier tout le contenu de ce JSON dans la variable d'environnement
   `FIREBASE_SERVICE_ACCOUNT` (sur une seule ligne), en local et sur Vercel
4. Sur https://dashboard.stripe.com/webhooks → "Ajouter un endpoint" :
   URL = `https://TON-DOMAINE.vercel.app/api/stripe-webhook`,
   événement à écouter = `checkout.session.completed`
5. Stripe te donne une "signing secret" (`whsec_...`) → à mettre dans
   `STRIPE_WEBHOOK_SECRET`, en local et sur Vercel
6. Chaque paiement réussi crée un document dans la collection Firestore `orders`
   (champs : nom, téléphone, adresse, total, statut, etc.) — ton espace admin peut lire
   cette collection directement (avec les règles de sécurité Firestore adaptées) ou via
   sa propre API.

Le paiement « à la livraison » continue de fonctionner sans backend, comme avant — pense
à l'enregistrer aussi côté Firestore si ton admin doit aussi le suivre (actuellement il
n'écrit que dans `localStorage`, dis-moi si tu veux que je l'ajoute).

### Passer en production (paiements réels)
Aucun code à modifier — seulement la clé :
1. Sur le dashboard Stripe, basculer en mode **Live** (en haut à droite)
2. Récupérer la clé secrète live (`sk_live_...`)
3. Sur Vercel → Settings → Environment Variables, remplacer `STRIPE_SECRET_KEY` par cette clé
4. Redéployer
Stripe demande aussi une vérification d'identité/entreprise (KYC) avant d'activer les paiements réels.

### Pour aller plus loin (non inclus)
- Un webhook Stripe (`checkout.session.completed`) pour enregistrer la commande de façon
  fiable côté serveur (base de données), indépendamment du retour navigateur.
- Une vraie base de données / API de commandes plutôt que `localStorage` pour le suivi.

## Effets premium V2+
- animations d’entrée des écrans et des cartes
- micro-interactions sur boutons, cartes et filtres
- zoom subtil des photos
- glow/hover sur CTA
- badge panier animé
- animation du logo
- panier flottant animé
- feedback animé lors d’un ajout au panier
- écran de confirmation animé
- respect de `prefers-reduced-motion`

## UX finale
Aucun compte, profil ou connexion : la navigation mobile est volontairement limitée à
**Accueil · Menu · Panier · Suivi**. La commande reste possible sans créer de compte.
