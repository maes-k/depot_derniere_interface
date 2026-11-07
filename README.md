# Dépôt du Bâtiment — Interface de présentation

Version validée le 07/11/2026 à 10 h 57 (Abidjan).

Site statique prêt pour GitHub Pages. Aucun serveur Node.js, fichier .env ou base de données n’est nécessaire. Les produits et les catégories de démonstration sont fournis dans `catalogue-demo.js`.

## Contenu

- Pages Accueil, À propos, Boutique et Contact.
- Nouveau footer anthracite, bordure orange et texte clair sur les quatre pages.
- Bannière pleine largeur et catalogue illustré sur l’accueil.
- Menu mobile compact et panier partagé entre les pages.
- Vidéosurveillance classée par types de caméra : infrarouge, Full Color et bidirectionnelle.
- Kits caméra, solaire et clôture : vue d’ensemble et images des composants.
- Galeries dans les cartes et les fiches : glissement tactile, glisser à la souris, flèches et miniatures ; clavier avec flèches, Début et Fin lorsque la galerie est sélectionnée.

## Ouvrir dans VS Code

1. Extraire cette archive.
2. Ouvrir le dossier `interface-demo` dans VS Code.
3. Ouvrir `index.html` avec Live Server.

Il n’y a pas de `package.json` : ne pas exécuter npm install pour cette version.

## Mettre à jour le dépôt GitHub existant

Conserver une copie de votre projet connecté et de votre base séparément.
Copier le contenu du dossier `interface-demo` dans le dossier de votre dépôt de présentation existant, au même niveau que son `index.html`. Conserver le dossier `.git` existant.

Dans le terminal de ce dépôt :

```powershell
git status --short
git add .
git commit -m "Ajoute l’interface validée et les galeries des kits"
git push
```

Si le dépôt est tout neuf, ouvrir le dossier `interface-demo` dans VS Code puis :

```powershell
git init
git add .
git commit -m "Ajoute l’interface Dépôt du Bâtiment"
git branch -M main
git remote add origin URL_DU_NOUVEAU_DEPOT
git push -u origin main
```

Remplacer `URL_DU_NOUVEAU_DEPOT` par l’URL de votre dépôt vide.

## Afficher et partager le site avec GitHub Pages

Sur GitHub : dépôt → Settings → Pages → Build and deployment.
Choisir Deploy from a branch, branche `main`, dossier `/ (root)`, puis Save.
Quand le déploiement est terminé, GitHub affiche le lien du site. Partager ce lien pour montrer l’interface (le lien du dépôt affiche le code).
Le fichier `index.html` doit se trouver à la racine du dépôt. Le fichier `.nojekyll` est fourni pour servir tous les fichiers statiques.

## Données de présentation et limites

Les images générées et les compositions des kits sont illustratives. Références, quantités, puissances et prix réels doivent être confirmés avant utilisation commerciale.
Le panier et les favoris sont conservés localement dans le navigateur. L’administration connectée et les paiements Wave / Orange ne sont pas actifs dans cette version statique. Les contacts téléphone, WhatsApp et e-mail utilisent les coordonnées du site.
Le code d’intégration de l’administration est conservé pour les travaux ultérieurs, mais GitHub Pages ne fournit pas d’API ni de connexion PostgreSQL.
Les sous-catégories et galeries ne sont pas importées dans votre base : le backend, le schéma et le formulaire administrateur devront être adaptés dans la version connectée.
Cette archive ne modifie pas votre projet local ni votre base de données.
