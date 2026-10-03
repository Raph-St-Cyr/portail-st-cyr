# Portail Saint-Cyr — V6.2 architecture modulaire

Base fonctionnelle : V6.1 validée (authentification, Supabase, synchronisation automatique, Realtime, PWA).

## Organisation
- `index.html` : structure HTML et présentation. Aucun moteur métier n'y est désormais embarqué.
- `js/01-pilotage.js` : noyau métier historique (actions, dossiers, réunions, données locales). Ce fichier reste le bloc métier partagé à refactorer avec prudence.
- `js/04-navigation-bibliotheque.js` : accueil, navigation, bibliothèque documentaire.
- `js/05-mobile.js` : ergonomie/navigation mobile uniquement.
- `js/06-supabase-securite-sync.js` : bloc protégé : Auth Supabase, verrouillage, sauvegarde cloud, synchronisation automatique et Realtime.
- `js/07-pwa.js` : enregistrement du service worker.
- `service-worker.js` : cache PWA versionné V6.2.
- `manifest.webmanifest` : manifeste PWA.

## Règle de non-régression
Ne pas modifier `js/06-supabase-securite-sync.js` lors d'une évolution fonctionnelle d'un autre module, sauf si l'évolution concerne explicitement Auth/Supabase/Realtime.
Toujours partir de cette version ou de sa descendante validée.

## Limite volontaire
Pour éviter une régression lors de cette migration, le noyau historique Actions/Dossiers/Réunions reste dans `01-pilotage.js`. Il est séparé des couches navigation, mobile, PWA et Supabase, mais ses trois sous-domaines partagent encore `db`, `save()` et `render()`. Une séparation plus fine devra être faite progressivement avec tests de non-régression.

- V6.2.5 : bibliothèque — formulaire d’ajout déplacé dans une fenêtre modale ouverte par « + Ajouter une ressource ».

- V6.2.10 : le bouton Modifier de la bibliothèque rouvre le formulaire prérempli avec un bouton Enregistrer.


## V6.2.11
- Migration automatique et idempotente des anciennes ressources locales de type lien vers `portal_resources` après authentification.
- Les fichiers binaires locaux ne sont pas migrés.

## V6.2.12
- Évolution unique : actualisation temps réel de la bibliothèque sur les changements de `portal_resources`.
