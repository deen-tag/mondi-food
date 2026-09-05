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
- Site déployé sur Vercel : **mondi-food.vercel.app**, dernier déploiement vert.
- Espace **Admin** (`/admin.html`) et **Livreur** (`/driver.html`), branchés sur Firestore
  via une API sécurisée — voir "Admin & Livreur" ci-dessous.
- Notifications admin en 3 couches (bip sonore, notif navigateur/titre clignotant, push
  Service Worker même app fermée) + polling optimisé pour rester dans les quotas gratuits
  Firestore — voir "Notifications & optimisation des lectures" ci-dessous.
- Toutes les variables d'environnement ajoutées sur Vercel (Firebase, Stripe, admin, VAPID)
  — voir la liste complète dans "Variables d'environnement" ci-dessous.
- Système de **codes promo** autonome pour le restaurant : création/activation/
  suppression depuis `/admin.html`, réduction calculée et revalidée côté serveur (jamais
  côté client), fonctionne pour les deux modes de paiement — voir "Codes promo" ci-dessous.
- **Connexion admin testée et fonctionnelle** sur `/admin.html`.
- Le nombre de fonctions serverless a été ramené sous la limite de 12 du plan Vercel
  Hobby (11 fonctions actuellement, voir "Fonctions serverless & limite Hobby").

### ⚠️ À faire
1. Se connecter sur `/admin.html` et ajouter un premier livreur, pour que `/driver.html`
   ait quelqu'un à proposer.
2. Tester un paiement Stripe en mode test **et** une commande "à la livraison", vérifier
   que les deux apparaissent dans Firestore (`orders`) et dans `/admin.html`.
3. Sur `/admin.html`, cliquer sur 🔕 pour activer les notifications push et vérifier
   qu'elles arrivent bien (variables VAPID déjà en place).
4. Avant de passer en paiements réels : voir "Passer en production" plus bas.
5. **Ajouter un bouton "changer le mot de passe" directement dans `/admin.html`**, pour que
   le restaurant puisse le modifier lui-même sans passer par Vercel. Pas encore fait.
6. **Nettoyage** : `main.js` et `style.css` à la racine du projet sont des restes non
   utilisés (le site charge `/src/main.js` et `/src/style.css`, jamais ces deux-là — voir
   `vite.config.js` et les `<script>` de `index.html`). À supprimer un jour pour éviter
   toute confusion, sans urgence puisqu'ils n'ont aucun effet sur le site actuel.
7. **Rotation de clés à prévoir** : voir "Sécurité" ci-dessous, `FIREBASE_SERVICE_ACCOUNT`
   à régénérer par précaution quand possible.

### 🔐 Sécurité — rappel
- Le contenu complet de `FIREBASE_SERVICE_ACCOUNT` a été partagé en clair dans une
  conversation avec l'assistant IA pendant la mise en place (donc potentiellement
  journalisé côté fournisseur IA). **Elle n'a pas été régénérée** — choix assumé pour
  l'instant, rien d'anormal constaté, mais à régénérer sur Firebase Console dès que
  l'activité du site le permettra, par précaution.
- Une clé Stripe avait aussi été collée par erreur dans la variable
  `FIREBASE_SERVICE_ACCOUNT` au tout début — corrigé, chaque clé est maintenant dans sa
  propre variable.
- Si une clé venait à fuiter ailleurs (collée dans un ticket public, un commit, etc.),
  le réflexe est le même : la régénérer et révoquer l'ancienne immédiatement, ne jamais attendre.
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
| `api/admin-auth.js` | GET vérif session · POST `{action:'login'\|'logout'}` | public → session |
| `api/orders.js` | GET liste des commandes (7 derniers jours) · GET `?ping=1` compteur léger · GET `?stats=1` totaux depuis toujours · POST création (paiement à la livraison) | GET/stats/ping admin · POST public |
| `api/orders/[id].js` | PATCH statut/livreur/paiement/annulation (avec effets de bord serveur : libère le livreur à la livraison/annulation) · DELETE suppression définitive | admin |
| `api/drivers.js` | GET liste des livreurs · POST ajout | GET public · POST admin |
| `api/drivers/[id].js` | PATCH statut d'un livreur (vue admin) | admin |
| `api/driver.js` | GET livraisons d'un livreur · POST `{action:'status'}` bascule dispo/pause · POST `{action:'deliver'}` marque sa propre commande livrée | public, restreint (scoping par `driverId`) |
| `api/track.js` | Suivi client — statut uniquement, jamais adresse/téléphone | public |
| `api/_push.js` | Envoi des notifications push (VAPID) à tous les appareils admin abonnés ; jamais bloquant pour la création de commande | interne |
| `api/push-subscribe.js` | GET clé publique VAPID · POST enregistre un abonnement · DELETE le supprime | GET public · POST/DELETE admin |

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

**Collection `pushSubscriptions`** (un document par appareil admin abonné aux notifs
push, id = hash de l'endpoint) :

| Champ | Type | Détail |
|---|---|---|
| `endpoint`, `keys` | string, object | Objet `PushSubscription` standard du navigateur, stocké tel quel |


### Notifications & optimisation des lectures Firestore

**Le problème de départ :** l'admin vérifiait les nouvelles commandes en rechargeant
*toute* la liste toutes les 5s, avec une requête sans limite de date (`limit(300)` peu
importe l'âge des commandes). Sur un volume réel, ça pouvait représenter plusieurs
centaines de milliers de lectures Firestore par jour — bien au-delà du quota gratuit
Spark (50 000 lectures/jour).

**Ce qui a été mis en place pour rester dans les quotas gratuits :**
- `GET /api/orders` ne renvoie que les commandes des **7 derniers jours** (plafonné à
  200), au lieu de "les 300 dernières peu importe leur âge".
- `GET /api/orders?ping=1` : un mode "léger" qui ne renvoie qu'un **compteur** (requête
  d'agrégation Firestore, ~1 lecture peu importe le nombre de commandes). L'admin
  l'appelle toutes les 15s ; il ne va chercher la liste complète que si ce compteur a
  changé, c'est-à-dire qu'il y a vraiment du nouveau.
- `GET /api/orders?stats=1` : totaux "depuis toujours" (nombre de commandes + chiffre
  d'affaires), via agrégation `count()`/`sum()` — chargé une seule fois à l'ouverture de
  l'onglet Historique, jamais en boucle.

**Notifications, en 3 couches indépendantes (`src/admin.js`) :**
1. **Bip sonore** (Web Audio, aucun fichier) — si l'onglet dashboard est ouvert et affiché.
2. **Notification navigateur + titre d'onglet clignotant** — si l'onglet est ouvert mais
   en arrière-plan (autre onglet actif). S'arrête dès que l'onglet redevient visible.
3. **Push (Service Worker, `public/sw.js`)** — fonctionne même navigateur/onglet fermé ou
   téléphone verrouillé, tant que l'appareil a du réseau. C'est le seul mécanisme qui ne
   dépend pas d'un onglet ouvert : le serveur contacte directement l'appareil (`api/_push.js`)
   au moment de la création de la commande (`api/orders.js` et `api/stripe-webhook.js`),
   au lieu que le client interroge le serveur en boucle.

Le bouton 🔕/🔔 dans l'en-tête admin active/désactive le push sur l'appareil courant
(chaque appareil a son propre abonnement indépendant, stocké dans Firestore
`pushSubscriptions`). Un appareil éteint ou hors ligne n'empêche jamais l'envoi vers un
autre appareil abonné, et un échec d'envoi push ne bloque jamais la création de la commande
(erreurs toujours capturées, jamais remontées au client).

**Configuration nécessaire pour activer le push (sinon les commandes se créent
normalement, juste sans notif push) :**
1. Générer une paire de clés : `npx web-push generate-vapid-keys`
2. Vercel → Settings → Environment Variables, ajouter :
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` — doit être au format `mailto:ton-email@exemple.com` (le préfixe
     `mailto:` est obligatoire, sinon `web-push` refuse de démarrer)
3. Redéployer
4. Sur `/admin.html`, cliquer sur 🔕 pour s'abonner (le navigateur demande l'autorisation)

**Limite connue :** sur iOS, le push ne fonctionne que si le site est ajouté à l'écran
d'accueil comme une PWA (iOS 16.4+). Sur Android et desktop, ça marche directement dans
le navigateur.

**Collection `promoCodes`** (un document par code, id = code en majuscules) :

| Champ | Type | Détail |
|---|---|---|
| `type` | string | `percent` (pourcentage) \| `fixed` (montant fixe en €) |
| `value` | number | Ex: `10` pour -10%, ou `5` pour -5€ |
| `active` | boolean | L'admin peut désactiver sans supprimer (garde l'historique d'usage) |
| `minSubtotal` | number | Sous-total minimum requis pour utiliser le code (0 = aucun minimum) |
| `maxUses` | number \| null | `null` = illimité |
| `usedCount` | number | Incrémenté uniquement quand une commande est réellement confirmée |
| `createdAt` | ISO string | |

### Codes promo

Gérés entièrement depuis l'onglet **"Codes promo"** de `/admin.html` : création, activation/
désactivation, suppression — le restaurant est autonome, aucune intervention technique
nécessaire. Tout passe par `api/orders.js` (pas de fichier séparé, pour ne pas consommer
de fonction serverless supplémentaire — voir "Fonctions serverless & limite Hobby") :

- `GET /api/orders?validatePromo=CODE&subtotal=X` — public, utilisé par le checkout pour
  prévisualiser la réduction avant validation. Ne décompte jamais l'usage.
- `GET /api/orders?promo=1` — admin, liste des codes.
- `POST /api/orders` avec `action: 'promo-create' | 'promo-toggle' | 'promo-delete'` —
  admin, gestion des codes.
- La réduction est **recalculée et revalidée côté serveur** juste avant la création
  réelle de la commande (`api/orders.js` pour le paiement à la livraison,
  `api/create-checkout-session.js` + webhook pour le paiement en ligne via un coupon
  Stripe créé à la volée) — jamais confiance dans une réduction affichée plus tôt côté
  client. L'usage n'est décompté (`usedCount`) qu'à la confirmation réelle du paiement,
  jamais à la simple prévisualisation.

**Limite connue :** l'incrément de `usedCount` n'est pas transactionnel entre la
vérification (`maxUses`) et l'écriture — sur un tout petit volume de commandes
simultanées avec un `maxUses` serré, une légère sur-utilisation est théoriquement
possible. Non bloquant pour un usage restaurant classique.

### Fonctions serverless & limite Hobby
Le plan **Vercel Hobby** (gratuit) autorise au maximum **12 fonctions serverless par
déploiement**. Chaque fichier `.js` dans `api/` (sauf ceux préfixés `_`, qui sont des
utilitaires internes non déployés) compte comme une fonction. Actuellement : 11 fonctions
(`admin-auth`, `create-checkout-session`, `driver`, `drivers`, `drivers/[id]`, `orders`,
`orders/[id]`, `push-subscribe`, `stripe-webhook`, `track`, `verify-session`) — reste 1
de marge.

Le projet a déjà dépassé cette limite une fois (14 fonctions), ce qui a **bloqué le
déploiement sans message d'erreur clair** dans l'interface Vercel (build réussi, puis
échec silencieux juste après, à l'étape "Deploying outputs..."). Réglé en fusionnant
plusieurs fichiers en un seul, distinguant les actions via `req.method` et un champ
`action` dans le corps de la requête (voir `api/admin-auth.js` et `api/driver.js`
pour des exemples de ce pattern).

**Si ce plafond est de nouveau approché** (nouvelle fonctionnalité, nouveau fichier dans
`api/`) : soit fusionner d'autres fichiers sur ce même modèle, soit passer sur le plan
**Vercel Pro** (payant), qui lève cette limite. À noter aussi : le plan Hobby est réservé
à un usage non-commercial d'après les conditions d'utilisation de Vercel — un site qui
prend de vrais paiements pour un restaurant est un usage commercial, donc passer sur Pro
sera de toute façon à prévoir avant un vrai lancement, indépendamment du nombre de fonctions.

### Variables d'environnement (toutes déjà configurées sur Vercel, sauf mention contraire)
- `FIREBASE_SERVICE_ACCOUNT` — JSON complet de la clé de service Firebase (téléchargé
  depuis Firebase Console → Paramètres du projet → Comptes de service).
- `STRIPE_SECRET_KEY` — clé secrète Stripe (`sk_test_...` en test, `sk_live_...` en prod).
- `STRIPE_WEBHOOK_SECRET` — signature du webhook Stripe (Dashboard Stripe → Webhooks →
  ton endpoint → "Signing secret"), utilisée par `api/stripe-webhook.js` pour vérifier
  que l'événement vient bien de Stripe.
- `ADMIN_PASSWORD` — mot de passe de connexion à `/admin.html`.
- `ADMIN_SESSION_SECRET` — chaîne aléatoire longue générée une fois (`openssl rand -hex 32`).
  La changer invalide instantanément toutes les sessions admin en cours — utile si elle fuite.
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — notifications push admin,
  voir "Notifications & optimisation des lectures" ci-dessus. **Facultatif** : sans ces
  3 variables, tout fonctionne normalement, juste sans notif push.

### Limites connues (MVP)
- Le livreur fait toujours un poll toutes les 5s (`src/driver.js`), requête restreinte
  à ses propres livraisons donc sans risque de quota. L'admin, lui, ne poll plus la liste
  complète en boucle — voir "Notifications & optimisation des lectures" ci-dessus.
- Le livreur s'identifie en choisissant son nom dans une liste, sans mot de passe —
  suffisant pour une petite équipe de confiance, pas pour une vraie authentification.
- Si Firestore répond *"the query requires an index"* sur `api/driver.js` ou `api/orders.js`
  (mode `?ping=1`/`?stats=1`), ouvrir le lien donné dans le message d'erreur : Firebase
  Console crée l'index composite en un clic.


