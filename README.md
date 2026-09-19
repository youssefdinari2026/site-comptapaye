# ComptaPaye — site vitrine (comptapaye.com)

Site statique (HTML / CSS / JavaScript) avec un petit formulaire de contact en PHP.
Pas de WordPress, pas de base de données, pas de plugin : surface d'attaque minimale, chargement très rapide.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil |
| `services.html` | Détail des services et formules |
| `simulateur-brut-net.html` | Simulateur salaire brut ↔ net (calcul dans le navigateur) |
| `actualites.html` | Actualités fiscales, sociales et comptables (fiches avec filtres par thème) |
| `offres-clients.html` | Vitrine des annonces de nos clients + formulaire de dépôt d'annonce |
| `annonce.php` | Reçoit une annonce et l'envoie au cabinet par e-mail pour validation |
| `assets/data/annonces.json` | Liste des annonces publiées (voir plus bas) |
| `a-propos.html`, `contact.html` | Présentation, coordonnées et formulaire de contact |
| `candidature.html` | Page « Stage / Emploi » (s'ouvre dans un nouvel onglet) : candidature avec CV en pièce jointe |
| `mentions-legales.html`, `confidentialite.html` | Pages légales (RGPD, profession d'expert-comptable) |
| `404.html` | Page d'erreur |
| `contact.php`, `candidature.php` + `contact-config.php` | Envoi des formulaires par e-mail (les CV ne sont jamais stockés sur le serveur) |
| `.htaccess` | HTTPS, www → domaine nu, en-têtes de sécurité, cache, compression |
| `robots.txt`, `sitemap.xml` | Référencement |
| `assets/` | CSS, JS, images |

## À compléter avant la mise en ligne

1. **`mentions-legales.html`** : raison sociale, SIREN/SIRET, TVA et président sont renseignés (COMPTAPAIE EXPERT, SASU). Reste à compléter (repérés par `[À COMPLÉTER]`) : capital social, RCS le cas échéant, **n° d'inscription à l'Ordre des experts-comptables**, assurance responsabilité civile professionnelle. Obligatoire en France pour une profession réglementée.
2. **Adresse e-mail** : le site utilise `contact@comptapaye.com`. Créez cette boîte dans hPanel > E-mails, ou remplacez l'adresse partout (recherche/remplacement dans les fichiers) et dans `contact-config.php` (`$CONTACT_TO` pour les demandes, `$CAREERS_TO` pour les candidatures). Créez aussi `no-reply@comptapaye.com` (expéditeur des notifications) ou modifiez `$CONTACT_FROM`.
3. **Textes et engagements** : relisez tout le contenu et retirez ce qui ne correspond pas à votre activité (par ex. « rendez-vous au cabinet ou à distance »). Les formules « Sur devis » n'affichent volontairement aucun prix.
4. **Horaires d'ouverture** : non renseignés faute d'information ; à ajouter dans `contact.html` si souhaité.

## Mise en ligne sur Hostinger via GitHub

1. Créez un dépôt GitHub (ex. `comptapaye`) et envoyez-y **le contenu de ce dossier à la racine** (les fichiers `index.html`, `.htaccess`… doivent être à la racine du dépôt, pas dans un sous-dossier).
   - Sans Git installé : GitHub Desktop, ou glisser-déposer les fichiers dans l'interface web GitHub (« Add file » > « Upload files »), sans oublier `.htaccess`.
   - Avec Git :
     ```bash
     git init -b main
     git add .
     git commit -m "Site ComptaPaye"
     git remote add origin https://github.com/VOTRE-COMPTE/comptapaye.git
     git push -u origin main
     ```
2. Dans **hPanel** : ajoutez le domaine `comptapaye.com` à votre hébergement, puis activez le **SSL** (Sites web > Sécurité > SSL).
3. **Sites web > Gérer > Avancé > Git** : renseignez l'URL du dépôt et la branche `main`, laissez le chemin d'installation **vide** (= `public_html`), puis « Créer ».
   - Dépôt privé : utilisez l'URL SSH (`git@github.com:...`) et ajoutez la clé SSH affichée par Hostinger dans GitHub > Settings > Deploy keys.
4. **Déploiement automatique** : dans la même page Git, copiez l'URL du webhook Hostinger et collez-la dans GitHub > Settings > Webhooks > Add webhook (événement « push »). Chaque `git push` mettra alors le site à jour.
5. Vérifiez : `https://comptapaye.com`, les 8 pages, le formulaire de contact **et** le formulaire de candidature (envoyez-vous un test avec un CV en PDF : la pièce jointe doit arriver dans la boîte) et la page 404.
6. Une fois en ligne : ajoutez le site à **Google Search Console** et soumettez `https://comptapaye.com/sitemap.xml`.

## Publier une annonce de client

1. Le client remplit le formulaire de `offres-clients.html` : vous recevez un e-mail « Nouvelle annonce à valider » (à l'adresse `$ANNONCE_TO` de `contact-config.php`).
2. Après relecture, copiez le bloc JSON fourni en bas du mail dans la liste `"annonces"` du fichier `assets/data/annonces.json` (sur GitHub : ouvrir le fichier > crayon > coller > « Commit changes »). Séparez les annonces par une virgule.
3. Après le déploiement Hostinger, l'annonce apparaît sur la page (rechargement du fichier sous 5 minutes).

Champs d'une annonce : `id`, `date` (AAAA-MM-JJ), `categorie` (`offre`, `partenaire`, `emploi`, `cession`, `evenement`, `autre`), `titre`, `entreprise`, `description`, `contact`, `lien` (facultatif) et `expire` (facultatif, AAAA-MM-JJ : l'annonce disparaît après cette date). Pour retirer une annonce, supprimez son bloc.

## Modifier le site

- **Accueil animé** : diaporama de 2 diapositives, chacune avec sa photo de fond et son texte : n°1 = `hero-bg-1.jpg` (bannière de l'ancien site) + titre « Expert-comptable à Gennevilliers… » et schéma ; n°2 = `hero-bg-2.jpg` (photo Unsplash, licence libre) + « La satisfaction du client est notre devise… » et bouton Consulter. Le changement se fait tout seul toutes les 3 secondes (réglage : `DELAY` dans `assets/js/main.js`) (glissement de droite à gauche), avec les flèches, les points, le glissement du doigt sur mobile ou les flèches du clavier ; bouton pause ; le défilement s'arrête au survol et n'est pas automatique pour les visiteurs qui ont désactivé les animations. À chaque diapositive, les textes s'affichent comme un poème vertical : chaque vers (ligne courte, balise .verse dans index.html) remonte du bas et apparaît l'un après l'autre (effet repris de l'ancien site). Les textes se modifient dans les blocs `.hero-slide` de `index.html` ; pour changer une photo, remplacez le fichier (JPEG, 1920 px de large) et augmentez le numéro `?v=` des pages.
- **Textes des autres pages** : les blocs (titres, paragraphes, cartes) remontent et apparaissent au défilement (classe `reveal`), et le titre des pages intérieures au chargement.
- **Actualités** : chaque fiche est un bloc `<article class="news-card">` de `actualites.html`. Les textes sont des repères généraux à faire valider et à mettre à jour régulièrement.

- Mot du président : section `#president` de `index.html`, photo dans `assets/img/president.jpg` (640 × 800 px, portrait 4:5).
- En-tête : la barre du haut (adresse, e-mail, téléphone, bandeau orange « Stage / Emploi ») et la barre du logo disparaissent quand on descend dans la page et réapparaissent dès qu'on remonte (`assets/js/main.js`).
- Textes : éditez directement les fichiers `.html`. L'en-tête et le pied de page sont répétés dans chaque page : pensez à modifier chaque page pour un changement de menu.
- Couleurs : variables CSS en haut de `assets/css/style.css`.
- Après une modification de `style.css` ou `main.js`, changez le numéro de version dans les pages (`style.css?v=…` et `main.js?v=…`, dans le `<head>` de chaque `.html`) : cela force tous les navigateurs à recharger le fichier. Le cache serveur est de 1 heure pour le CSS/JS et nul pour les pages.

## Notes techniques

- Aucune police, script ou image chargé depuis un service tiers : pas de cookie, pas de bandeau de consentement à afficher, conforme RGPD.
- Une politique de sécurité de contenu (CSP) stricte est définie dans `.htaccess` : n'ajoutez pas de scripts ou styles « inline » (dans le HTML) ni de ressources externes sans adapter cette politique.
- Le simulateur brut/net utilise des taux moyens indicatifs (voir la page) ; à ajuster dans `assets/js/main.js` (`RATES`) si nécessaire.
