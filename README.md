# Mondi Food — Food Dark Kitchen

Site de livraison (Pannuezo & Pizza) : frontend Vite + backend serverless Vercel
(Stripe pour le paiement en ligne, Firestore pour les commandes et l'admin).

## 📌 État du projet

### ✅ Fait
- Frontend : identité noir/violet, menu Pizza/Pannuezo, fiche produit, panier, checkout,
  confirmation, suivi — voir "Site client" ci-dessous.
- Projet Firebase créé (**mondifood**, Cloud Firestore Standard, mode production, région eur3).
- Compte Stripe créé, paiement en ligne opérationnel via Stripe Checkout.
- Webhook Stripe configuré (`checkout.session.completed` → écrit la commande dans Firestore).
- Site déployé sur Vercel : **mondi-food.vercel.app**.
- Espace **Admin** (`/admin.html`) et **Livreur** (`/driver.html`), branchés sur Firestore
  via une API sécurisée — voir "Admin & Livreur" ci-dessous.

### ⚠️ À faire
1. Sur Vercel, ajouter les variables `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET`
   (voir "Variables d'environnement") puis redéployer.
2. Se connecter sur `/admin.html` et ajouter un premier livreur, pour que `/driver.html`
   ait quelqu'un à proposer.
3. Tester un paiement Stripe en mode test **et** une commande "à la livraison", vérifier
   que les deux apparaissent dans Firestore (`orders`) et dans `/admin.html`.
4. Avant de passer en paiements réels : voir "Passer en production" plus bas.

### 🔐 Sécurité — rappel
- Une clé de service Firebase a été régénérée et l'ancienne révoquée (elle avait été
  manipulée pendant la mise en place). Si une nouvelle clé (Firebase, Stripe, `ADMIN_SESSION_SECRET`...)
  fuite un jour (collée dans un chat, un ticket, un commit...), le réflexe est le même :
  la régénérer et révoquer l'ancienne immédiatement, ne jamais attendre.
- Aucun secret n'est commité dans ce dépôt : tout passe par les variables d'environnement Vercel.
- Le navigateur ne parle jamais directement à Firestore ni à Stripe avec une clé secrète —
  tout passe par les fonctions `api/`, qui recalculent les prix et vérifient chaque
  transition d'état côté serveur.

---

## Site client

- Navigation mobile : **Accueil · Menu · Panier · Suivi**, sans compte ni connexion.
- Menu Pizza / Pannuezo, fiche produit, panier, checkout avec choix du mode de paiement.
- Confirmation et suivi de commande en temps quasi réel (poll de l'API toutes les 5s).
- Animations : entrée des écrans/cartes, micro-interactions boutons/cartes/filtres,
  zoom photos, badge panier animé, respect de `prefers-reduced-motion`.

Lancer en local :
```
npm install
npm run dev
```
(pour tester aussi les fonctions `api/` en local : `vercel dev`, qui sert le frontend Vite
et les fonctions serverless ensemble)

## Paiement en ligne (Stripe)

- `api/create-checkout-session.js` — recalcule le panier côté serveur à partir de
  `api/_menu.js` (jamais confiance aux prix envoyés par le client), crée une session
  Stripe Checkout.
- `api/verify-session.js` — vérifie qu'une session est bien payée avant d'afficher la
  confirmation, au retour depuis Stripe.
- `api/stripe-webhook.js` — reçoit `checkout.session.completed`, vérifie la signature
  Stripe, et écrit la commande dans Firestore (source de vérité, indépendante du retour
  navigateur).
- `api/_firebase.js` — initialisation du SDK Firebase Admin.
- `api/_menu.js` — copie serveur du catalogue/prix ; à garder synchronisée avec `src/main.js`.

Le paiement « à la livraison » passe par `api/orders.js` (POST) : même recalcul de prix
côté serveur, écriture directe dans Firestore sans passer par Stripe.

### Passer en production (paiements réels)
Aucun code à modifier, seulement la clé :
1. Dashboard Stripe → mode **Live**, récupérer `sk_live_...`
2. Vercel → Settings → Environment Variables → remplacer `STRIPE_SECRET_KEY`
3. Redéployer
Stripe demande aussi une vérification d'identité/entreprise (KYC) avant d'activer les paiements réels.

## Admin & Livreur

Deux pages supplémentaires, servies par le même déploiement Vercel :
- **`/admin.html`** — dashboard équipe : compteurs, alerte sonore sur nouvelle commande,
  recherche/filtres, fiche commande (accepter avec temps de préparation, appeler/contacter
  le client, adresse + lien carte, notes, statut de paiement, assignation livreur,
  annulation avec motif), gestion des livreurs, historique (jour/hier/semaine).
- **`/driver.html`** — écran simplifié par livreur : choix du nom, ses livraisons en cours
  uniquement (adresse, carte, appel, montant à encaisser), bouton **Livrée**, disponibilité
  (pause/dispo) quand il n'a rien en cours.

Toute la logique sensible vit côté serveur, jamais dans le navigateur :

| Fichier | Rôle | Accès |
|---|---|---|
| `api/_admin-auth.js` | Signature/vérification du cookie de session admin (HMAC) | interne |
| `api/admin-login.js` / `admin-logout.js` / `admin-session.js` | Connexion / déconnexion / vérif session admin | public → session |
| `api/orders.js` | GET liste des commandes · POST création (paiement à la livraison) | GET admin · POST public |
| `api/orders/[id].js` | PATCH statut/livreur/paiement/annulation, avec effets de bord serveur (libère le livreur à la livraison/annulation) | admin |
| `api/drivers.js` | GET liste des livreurs · POST ajout | GET public · POST admin |
| `api/drivers/[id].js` | PATCH statut d'un livreur (vue admin) | admin |
| `api/driver-status.js` | Un livreur bascule lui-même dispo ↔ pause | public, restreint |
| `api/driver-orders.js` | Livraisons assignées à un livreur donné | public, scoping par `driverId` |
| `api/driver-deliver.js` | Un livreur marque sa propre commande livrée (vérifie qu'elle lui appartient) | public, restreint |
| `api/track.js` | Suivi client — statut uniquement, jamais adresse/téléphone | public |

### Schéma Firestore

**Collection `orders`** (un document par commande) :

| Champ | Type | Détail |
|---|---|---|
| `orderId` | string | Code court affiché au client (`DK-1042`) |
| `firstName`, `phone`, `address`, `zip`, `city`, `note` | string | Coordonnées client |
| `items` | array | `{ name, qty, price, opts? }` |
| `total`, `currency` | number, string | |
| `paymentMethod` | string | `online` \| `delivery` |
| `paymentStatus` | string | `paye` \| `attente` \| `echoue` |
| `status` | string | `received` → `preparing` → `delivering` → `delivered` (ou `cancelled`) |
| `driverId` | string \| null | Référence vers `drivers` |
| `prepEstimate` | number \| null | Minutes, saisi à l'acceptation |
| `readyAt`, `deliveryStartedAt`, `deliveredAt` | ISO string \| null | Horodatages |
| `cancelReason` | string \| null | Motif si `status = cancelled` |
| `createdAt` | ISO string | |
| `stripeSessionId` | string | Présent uniquement si `paymentMethod = online` |

**Collection `drivers`** :

| Champ | Type | Détail |
|---|---|---|
| `name` | string | Prénom affiché |
| `status` | string | `dispo` \| `livraison` \| `pause` |

### Variables d'environnement à ajouter sur Vercel
- `ADMIN_PASSWORD` — mot de passe de connexion à `/admin.html`.
- `ADMIN_SESSION_SECRET` — chaîne aléatoire longue générée une fois (`openssl rand -hex 32`).
  La changer invalide instantanément toutes les sessions admin en cours — utile si elle fuite.

### Limites connues (MVP)
- Pas de temps réel poussé (websocket) : admin et livreur font un poll toutes les 5s.
- Le livreur s'identifie en choisissant son nom dans une liste, sans mot de passe —
  suffisant pour une petite équipe de confiance, pas pour une vraie authentification.
- Si Firestore répond *"the query requires an index"* sur `api/driver-orders.js`, ouvrir
  le lien donné dans le message d'erreur : Firebase Console crée l'index composite en un clic.

