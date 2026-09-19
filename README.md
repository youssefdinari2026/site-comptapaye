# ComptaPaye — site vitrine (comptapaye.com)

Site statique (HTML / CSS / JavaScript) avec un petit formulaire de contact en PHP.
Pas de WordPress, pas de base de données, pas de plugin : surface d'attaque minimale, chargement très rapide.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil |
| `services.html` | Détail des services et formules |
| `simulateur-brut-net.html` | Simulateur salaire brut ↔ net (calcul dans le navigateur) |
| `a-propos.html`, `contact.html` | Présentation, formulaire de contact |
| `mentions-legales.html`, `confidentialite.html` | Pages légales (RGPD) |
| `404.html` | Page d'erreur |
| `contact.php` + `contact-config.php` | Envoi du formulaire par e-mail |
| `.htaccess` | HTTPS, www → domaine nu, en-têtes de sécurité, cache, compression |
| `robots.txt`, `sitemap.xml` | Référencement |
| `assets/` | CSS, JS, images |

## À compléter avant la mise en ligne

1. **`mentions-legales.html`** : raison sociale, adresse, SIREN/SIRET, TVA, directeur de la publication (repérés par `[À COMPLÉTER]`). Obligatoire en France.
2. **Adresse e-mail** : le site utilise `contact@comptapaye.com`. Créez cette boîte dans hPanel > E-mails, ou remplacez l'adresse partout (recherche/remplacement dans les fichiers) et dans `contact-config.php`. Créez aussi `no-reply@comptapaye.com` (expéditeur des notifications) ou modifiez `$CONTACT_FROM`.
3. **Textes et engagements** : relisez tout le contenu et retirez ce qui ne correspond pas à votre activité. Les formules « Sur devis » n'affichent volontairement aucun prix.
4. **Titre « expert-comptable »** : ce terme est réglementé en France. Il n'est volontairement pas utilisé sur le site ; ne l'ajoutez que si vous y êtes légalement habilité.

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
5. Vérifiez : `https://comptapaye.com`, les 7 pages, le formulaire de contact (envoyez-vous un message de test) et la page 404.
6. Une fois en ligne : ajoutez le site à **Google Search Console** et soumettez `https://comptapaye.com/sitemap.xml`.

## Modifier le site

- Textes : éditez directement les fichiers `.html`. L'en-tête et le pied de page sont répétés dans chaque page : pensez à modifier chaque page pour un changement de menu.
- Couleurs : variables CSS en haut de `assets/css/style.css`.
- Après une modification de CSS/JS, videz le cache du navigateur (Ctrl + F5) : les fichiers sont mis en cache une semaine.

## Notes techniques

- Aucune police, script ou image chargé depuis un service tiers : pas de cookie, pas de bandeau de consentement à afficher, conforme RGPD.
- Une politique de sécurité de contenu (CSP) stricte est définie dans `.htaccess` : n'ajoutez pas de scripts ou styles « inline » (dans le HTML) ni de ressources externes sans adapter cette politique.
- Le simulateur brut/net utilise des taux moyens indicatifs (voir la page) ; à ajuster dans `assets/js/main.js` (`RATES`) si nécessaire.
