# Jeux

Chaque jeu aura son propre module contenant ses règles, son état et ses données.
Les modules de jeu utiliseront les services génériques de rooms et de joueurs.
La couche Socket.io transmettra les commandes aux services concernés.

`index.js` expose le registre des jeux. Seul Undercover est implémenté, avec indices, votes et fin de partie.

Contrat d'un module : `defaultSettings()`, `options()` (métadonnées publiques), `validateSettings(input)` et `start(players, settings)`. Le démarrage retourne un état serveur avec une Map `assignments` indexée par identifiant public du joueur. Le service de rooms conserve cet état séparément de son snapshot public et prépare les envois individuels pour Socket.io.

Le module fournit aussi `publicState(state)`, `act(state, playerId, action, payload)` et `advance(state, now)` pour les commandes et transitions chronométrées. Les rooms délèguent les règles au module et diffusent uniquement sa projection publique.
