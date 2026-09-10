# PartyRoom

Socle d'une plateforme de mini-jeux multijoueur : React/Vite, Tailwind CSS, Express et Socket.io, en JavaScript avec modules ES. Aucun accès à une base de données.

Les styles utilisent les classes utilitaires Tailwind directement dans les composants React et dans `client/index.html` pour la base de page. `client/src/styles.css` contient l’import Tailwind, les couleurs et rayons du thème shadcn, ainsi que la couleur de bordure de base. Le plugin `@tailwindcss/vite` génère le CSS pendant le développement et le build, selon l'[installation officielle avec Vite](https://tailwindcss.com/docs/installation/using-vite).

## Démarrage

Depuis la racine, installer les dépendances :

```sh
npm install
```

Dans deux terminaux distincts :

```sh
npm run dev:server
```

```sh
npm run dev:client
```

Le client est accessible sur http://localhost:5173 et le serveur sur http://localhost:3001. Vite relaie `/api` et `/socket.io` vers le serveur, y compris les connexions WebSocket.
Le port du serveur peut être changé avec `PORT` ; adapter alors les cibles du proxy dans `client/vite.config.js`.

## Structure

```text
client/
  index.html
  vite.config.js
  src/
    main.jsx                  # Entrée React
    App.jsx                   # Accueil, lobby ou partie selon la session
    components/               # Formulaire d'accueil et lobby
    games/undercover/         # Paramètres et carte privée
    hooks/useRoom.js          # Connexion Socket.io et état de session
    styles.css
server/
  src/
    index.js                  # Serveur HTTP + Socket.io
    app.js                    # Application Express, GET /api/health
    socket/index.js           # Connexions temps réel
    rooms/                    # Gestion générique des rooms en mémoire
    players/                  # Création et validation des joueurs
    games/
      index.js                # Registre des modules de jeux
      undercover/
        index.js              # Validation, filtrage et attribution
        data/words.json       # Paires disponibles côté serveur uniquement
```

Les rooms et joueurs resteront indépendants des règles de jeu. Leur état sera conservé en mémoire côté serveur et perdu au redémarrage. Les données statiques des jeux seront des fichiers JSON côté serveur. Les informations secrètes devront rester séparées de l'état public diffusé aux rooms.

## Vérification et build

```sh
curl http://localhost:3001/api/health
npm run build
```

`npm run build` produit le client dans `client/dist`. `npm run start:server` démarre le serveur sans surveillance des fichiers. Le service du client en production et son proxy restent à configurer lors d'une étape dédiée.

## Rooms et lobby

L'accueil permet de créer une room ou de la rejoindre avec un code de 6 caractères et un pseudo de 2 à 24 caractères. Les pseudos doivent être distincts dans une même room (sans distinction de casse).

Le lobby affiche en temps réel les joueurs et l'hôte. Au départ de l'hôte, le premier joueur restant prend sa place. Les rooms vides sont supprimées. Une déconnexion ou un rafraîchissement réserve la place 60 secondes et déclenche une reconnexion automatique dans le même onglet. Après expiration, le joueur est retiré ; une room vide est supprimée.

Événements Socket.io : `room:create` et `room:join` reçoivent `{ nickname, code? }` et répondent par acknowledgement `{ ok, room, playerId }` ou `{ ok: false, error }`. `room:leave` répond `{ ok: true }`. `room:updated` diffuse l'état public aux membres de la room uniquement.

## Lancer Undercover

L'hôte choisit le nombre d'Undercover, les catégories et la difficulté. Ces paramètres sont synchronisés avec tous les joueurs. Il faut au moins 3 joueurs, au moins un intrus et une majorité stricte de Civils face aux Undercover.

Le bouton « Lancer Undercover » attribue aléatoirement les rôles. Chaque joueur peut révéler puis masquer sa carte privée (rôle et mot). La carte se masque aussi lorsque l'onglet perd le focus. La première sélection de paires Animaux/Nourriture suit la [référence fournie](https://undercover.gg/fr/words) et reste exclusivement dans le JSON serveur.

`room:settings` reçoit les paramètres complets. `room:start` et `room:reset` sont réservés à l'hôte, comme les paramètres. Ces actions répondent `{ ok: true }` ou `{ ok: false, error }`. L'état public `room:updated` inclut le statut, les paramètres et l'identifiant de partie, les attributions restent privées jusqu’à la fin de partie. `game:private` envoie uniquement `{ gameSessionId, role, word }` à la connexion du joueur concerné.

Une partie commencée n'accepte plus de nouveaux joueurs. L'hôte peut revenir au lobby. Un départ volontaire ou une reconnexion expirée annule la partie et ramène le groupe au lobby. Une courte coupure met uniquement la partie en pause.

## Tester le lobby

```sh
npm run test --workspace server
```

Les tests couvrent validation, appartenance unique, transfert d'hôte, suppression des rooms vides et échanges réels Socket.io (polling et WebSocket).

Ils vérifient également les paramètres, le filtrage des mots, la répartition des rôles, les droits de l'hôte, le refus d'un double lancement et l'absence de secrets dans les événements publics ou vers les connexions extérieures à la room.

Pour vérifier les écrans, ouvrir deux onglets sur http://localhost:5173 : créer une room dans le premier, rejoindre avec un autre pseudo dans le second, puis quitter depuis le premier. Le second joueur doit devenir hôte. Quitter le dernier onglet supprime la room ; rejoindre son ancien code doit échouer.

Pour vérifier le lancement, rejoindre une même room dans 3 onglets avec des pseudos différents. Depuis l'hôte, lancer avec les paramètres par défaut, puis révéler chaque carte : 2 Civils partagent un mot, 1 Undercover reçoit le mot voisin. Avec 5 joueurs, on peut choisir 2 Undercover.

## Tester avec plusieurs appareils sur le même Wi-Fi

Démarrer le serveur avec `npm run dev:server`, puis exposer le client au réseau local :

```sh
npm run dev --workspace client -- --host 0.0.0.0
```

Vite affiche une adresse `Network` (par exemple `http://192.168.1.20:5173`). Ouvrir cette adresse depuis les téléphones ou ordinateurs connectés au même Wi-Fi. Garder les deux terminaux ouverts. Le proxy Vite relaie aussi Socket.io : aucun changement d'URL dans le client n'est nécessaire.

Créer une room sur un appareil, partager son code, puis rejoindre avec deux autres joueurs. Vérifier la liste synchronisée, les droits de l'hôte et la distribution (avec les paramètres par défaut : deux Civils et un Undercover). Un rafraîchissement restaure automatiquement la session ; une coupure détectée met la partie en pause pendant au maximum 60 secondes.

Si l'adresse ne répond pas, vérifier que le pare-feu autorise Node sur le réseau local et que les appareils ne sont pas sur un Wi-Fi invité isolé. Sur cette adresse HTTP locale, la copie automatique peut être indisponible : saisir le code manuellement. Pour des amis sur d'autres réseaux, il faudra une URL publique via un hébergement ou un tunnel.

## Partie, manches et tours

Une partie contient **1 à 5 manches**. Chaque manche redistribue les rôles et les mots et remet tous les joueurs en jeu. Elle contient au maximum **1 à 5 tours**. Un tour comprend une phase d'indices suivie d'un vote.

Temps par joueur pour son indice, puis durée du vote : **10, 20, 30, 40 ou 60 secondes, ou Illimité**. En mode illimité, aucun délai ne fait avancer la phase : tous les joueurs vivants doivent envoyer leur indice puis voter. Réglages par défaut : **3 manches, 3 tours maximum, 30 secondes par phase**. Disponibles dès la création et modifiables par l'hôte au lobby.

Chaque joueur vivant envoie un indice de 1 à 120 caractères par tour dans le tchat. Les indices sont envoyés chacun son tour. Après le dernier joueur, le vote collectif commence. Un seul vote par joueur vivant contre un autre joueur vivant. Les cibles restent privées jusqu'au décompte. Tous les votes reçus ou le délai écoulé déclenchent l'élimination du joueur ayant le plus de voix ; une égalité ou l'absence de votes n'élimine personne.

Les Civils gagnent la manche en éliminant tous les Undercover. Les Undercover gagnent à parité ou en survivant au dernier tour. Une victoire Civil donne **2 points** à chaque Civil, une victoire Undercover **3 points** à chaque Undercover, même éliminé ; une défaite donne 0 point. Le serveur attribue les points une seule fois à la fin de chaque manche.

À chaque fin de manche, les cartes sont révélées et le classement provisoire est affiché. L'hôte lance la manche suivante avec de nouvelles attributions privées, tous les joueurs en jeu, un tchat et des votes vides, et les scores conservés. Après la dernière manche, le classement final désigne le ou les joueurs ayant le plus de points (ex æquo possibles). Rejouer revient au lobby et remet les scores à zéro au prochain lancement.

Le serveur contrôle les délais, identités, droits et victoires. Les commandes game:clue et game:vote portent gameSessionId et turn, plus text ou targetId. Une nouvelle manche reçoit un nouvel identifiant : les anciennes actions sont refusées. room:next est réservé à l'hôte et disponible seulement entre deux manches. Un départ volontaire ou une coupure de plus de 60 secondes annule la partie et ramène la room au lobby.

Tests sans port réseau : node --test server/test/rounds.test.js. Pour un essai rapide : 3 joueurs, 2 manches, 1 tour et 10 secondes par phase. Vérifier le score après chaque manche, la remise en jeu et le classement final.

## Reconnexion

Un jeton privé opaque est envoyé uniquement au joueur lors de la création ou de l'arrivée. Le client le conserve dans sessionStorage, propre à l'onglet et à l'adresse du site. À la reconnexion, room:resume restaure la même identité, l'hôte, les scores, indices, votes et la carte privée. Le jeton n'apparaît jamais dans un snapshot public. La reprise remplace l'ancienne connexion, qui perd ses droits.

Une coupure détectée réserve la place 60 secondes. La room est en pause tant qu'un joueur est absent : aucun indice, vote ou lancement n'est autorisé. L'échéance est prolongée de la durée totale de pause après le dernier retour. Le mode illimité reste sans échéance. Le joueur est affiché comme « Reconnexion… ».

Quitter volontairement invalide immédiatement la session. Une expiration retire le joueur, transfère l'hôte si nécessaire et annule la partie en cours. Un redémarrage du serveur efface toutes les sessions (MVP sans BDD). Une nouvelle adresse ou un autre navigateur ne partage pas la session ; il faut revenir sur la même adresse dans le même onglet. Si le stockage du navigateur est désactivé, une reconnexion sans rafraîchissement fonctionne, mais la reprise après rechargement n'est pas garantie.

Test manuel : lancer avec 3 joueurs, envoyer un indice et rafraîchir le même onglet. Vérifier la même carte et le même indice. Couper brièvement le Wi-Fi d'un joueur : les autres doivent voir la pause, puis la reprise. Tester aussi une absence supérieure à 60 secondes et un départ volontaire. Tests sans port : node --test server/test/reconnection.test.js server/test/rounds.test.js.

### Ordre des indices

Le serveur mélange les joueurs indépendamment des rôles à chaque nouvelle manche. Cet ordre reste identique entre les tours de la manche, en sautant les éliminés. Le tirage peut désigner à nouveau le même premier joueur. Seul le joueur désigné peut envoyer un indice. Le délai configuré s’applique à chaque joueur individuellement : un envoi ou une expiration passe au suivant. En mode illimité, seul l’envoi fait avancer. Après le dernier joueur, tous les survivants votent simultanément avec un délai collectif. La reconnexion conserve le joueur attendu et le temps restant.

## Interface

Accueil, lobby et partie partagent une direction bleu nuit/violet avec accents verts pour la présence. Les composants shadcn sont conservés dans client/src/components/ui, avec icônes Lucide et classes Tailwind. components.json et jsconfig.json configurent les composants JavaScript et l’alias @. Les variables du thème sont centralisées dans client/src/styles.css.

L’accueil propose les onglets Créer/Rejoindre. Le lobby sépare joueurs et paramètres sur grand écran et les empile sur mobile. La partie met en avant le joueur attendu, la carte privée, les indices, le vote et les résultats. Les actions et règles du serveur restent indépendantes de la présentation.

## Duel de foot

Choisir « Duel de foot » dans le formulaire de création. Deux participants maximum, 250 € fictifs chacun, 5 emplacements : GB, DC, MC, ATT et Joker. Le catalogue serveur contient 24 anciens joueurs ; photoUrl est réservé aux images futures. Les postes servent au jeu et ne constituent pas un historique complet des positions jouées.

Le premier inscrit ouvre la première enchère ; l’ouverture alterne ensuite A/B, indépendamment du vainqueur. Mise entière à partir de 1 €, augmentation minimale de 1 €. Le premier doit miser ; ensuite on peut surenchérir ou abandonner. Le gagnant paie sa dernière mise. Le serveur impose une réserve de 1 € par emplacement encore à remplir. Le poste naturel est rempli en priorité, sinon le Joker. Tant que les deux équipes sont incomplètes, une recrue compatible avec une seule équipe lui est proposée à 1 € : Recruter ou Passer. Passer remet la recrue en fin de sélection sans débiter le budget. Dès qu’une équipe est complète, le serveur complète automatiquement l’autre avec des recrues compatibles à 1 € chacune. Un joueur sans emplacement compatible est sauté.

Les deux équipes complètes sont affichées sur leurs terrains, côte à côte sur grand écran et empilées sur mobile. Pas de score automatique. Rejouer revient au lobby. Les règles de pause/reconnexion communes s’appliquent.

Module : server/src/games/football. Interface : client/src/games/football. room:create accepte gameId ; game:bid et game:pass portent gameSessionId et auction, plus amount pour une mise. La file des prochaines recrues reste sur le serveur. Tests : node --test server/test/football.test.js.

Les raccourcis ¼, ½, ¾ et Max remplissent la mise à partir du maximum autorisé (budget moins 1 € par poste restant après achat), avec arrondi inférieur. Une confirmation est toujours nécessaire. Un raccourci ne permettant pas de surenchérir est désactivé.

## Défi Chrono et sélection des modes

L'accueil affiche trois cartes « À l'affiche » : Undercover, Mercato et Défi Chrono. La carte sélectionne le jeu du formulaire Créer/Rejoindre. Le code de room détermine automatiquement le jeu à rejoindre, indépendamment de la carte sélectionnée. Une session existante continue de se restaurer automatiquement.

Chrono : au moins 2 joueurs, 1 à 5 manches (3 par défaut). Chaque manche mélange l'ordre et tire une cible commune de 3 à 10 secondes. À son tour, le joueur démarre puis arrête son buzzer. Le mode difficile masque le compteur pendant la mesure. Le classement cumule les écarts absolus en millisecondes ; le total le plus faible gagne, avec ex æquo possibles.

La mesure utilise performance.now dans le navigateur, après confirmation du démarrage par le serveur. Le serveur valide le tour, les bornes de durée et compte les résultats ; cette approche entre amis n'est pas une protection complète contre un client modifié. Un essai expiré (30 secondes) ou passé ajoute 30 secondes d'écart. Après une coupure/actualisation pendant la mesure, la session revient mais la mesure locale est perdue : passer l'essai ou attendre son expiration. Aucun temps partiel n'est affiché aux adversaires.

Module serveur : server/src/games/chrono. Interface : client/src/games/chrono. Événements game:begin, game:stop et game:forfeit avec gameSessionId et round ; stop ajoute elapsedMs. Tests sans réseau : node --test server/test/chrono.test.js.

À reprendre ensuite : catalogue partagé pour les jeux, imports de données et photos depuis des sources externes, puis API PartyRoom. Aucun import externe de catalogue n'a été ajouté à cette étape.
