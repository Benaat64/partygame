# Frontend SOFA

React + Vite. `App.jsx` choisit l’écran et relie les actions à `useRoom`. Le hook reste responsable de Socket.io, des accusés de réception et de la reconnexion.

## Responsabilités des composants

- `components/Home.jsx` : navigation avant la room et conservation du pseudo, code et réglages. `components/home/` contient la bibliothèque, le formulaire de création et celui pour rejoindre. Les formulaires sont contrôlés : les démonter ne supprime pas les saisies conservées dans Home.
- `components/Lobby.jsx` : invitation, présence et réglages avant la partie.
- `games/football/Game.jsx` : composition de l’écran et sélection du terrain mobile. `Pitch` affiche le terrain, `TeamPlacement` les permutations, `Bidding` possède la saisie d’enchère, `Budgets` affiche les budgets. La clé du composant Bidding conserve la remise à zéro du montant au changement d’enchère ou de prix.
- `games/undercover/Game.jsx` : orchestration des phases, saisie de l’indice, horloge et masquage au changement de fenêtre. `SecretCard`, `ClueLog`, `VotePanel` et `Results` affichent leur partie de l’écran via des props et des callbacks.
- `games/chrono/Game.jsx` : mesure locale et actions du tour. `ClockDisplay` et `Buzzer` sont les contrôles visuels ; `Scoreboard` et `AttemptHistory` présentent les résultats. `format.js` partage le format des durées et des écarts.
- `components/ui/` : primitives d’interface ; `Brand` et `TurnNotice` : composants communs à SOFA.

Les composants visuels n’ouvrent pas de connexion réseau et ne décident pas des règles. Les règles, validations et secrets restent sur le serveur. Les états locaux restent au niveau nécessaire pour préserver leur durée de vie ; on n’extrait pas systématiquement chaque petit bloc de JSX.

## Vérification

Depuis la racine : `npm run build`. Les tests serveur restent dans `server/test/`. Aucun script de lint frontend n’est configuré actuellement. Les fichiers JavaScript/JSX sont mis en forme avec Prettier (apostrophes simples, virgules finales).
