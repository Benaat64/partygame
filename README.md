<p align="center">
  <img src="client/public/sofa.svg" width="80" alt="Logo SOFA" />
</p>

<h1 align="center">SOFA</h1>

<p align="center">
  <strong>Sit. Play. Laugh.</strong><br />
  Trois mini-jeux multijoueur dans le navigateur. Un pseudo, un code, et la partie commence.
</p>

<p align="center">
  <a href="https://partygame-client.vercel.app">Jouer à SOFA</a> ·
  <a href="#installation">Installer le projet</a> ·
  <a href="#architecture">Explorer l’architecture</a>
</p>

---

SOFA est une plateforme de jeux entre amis, sans inscription. Chaque joueur rejoint depuis son téléphone ou son ordinateur ; le lobby, les tours et les résultats sont synchronisés en temps réel.

Le projet met en pratique une application React, un serveur de jeu autoritaire et une architecture permettant d’ajouter des jeux sans réécrire la gestion des rooms.

## Les jeux

| Jeu | Joueurs | Le principe |
| --- | --- | --- |
| **Undercover** | 3 minimum | Donne des indices sur ton mot, compare ceux des autres et débusque les intrus. Personne ne connaît son propre camp. |
| **Mercato** | 2 | Avec 250 € fictifs chacun, remporte les enchères et compose ton équipe de football. |
| **Défi Chrono** | 2 minimum | Arrête le buzzer au plus près du temps cible. Pour corser le jeu, masque le compteur. |

<details>
<summary><strong>Les règles en détail</strong></summary>

### Undercover

- Les Civils reçoivent un même mot et les Undercover un mot associé. Chaque joueur reçoit **uniquement son mot**, jamais son rôle pendant la manche.
- L’hôte sélectionne les thèmes, les univers, les crossovers et le nombre d’Undercover. Les Civils doivent être majoritaires au départ.
- Deux tours d’indices précèdent le premier vote. Chacun parle à son tour ; le tableau regroupe les indices par joueur.
- Une égalité ou l’absence de vote entraîne un tour d’indices supplémentaire, puis un nouveau vote. Après une élimination sans victoire, un seul tour précède le prochain vote.
- Les Civils gagnent en éliminant tous les Undercover. Les Undercover gagnent lorsqu’ils sont au moins aussi nombreux que les Civils restants. Pas de limite de tours.
- Une partie contient 1 à 5 manches. Une victoire rapporte 2 points à chaque Civil ou 3 à chaque Undercover du camp gagnant, même éliminé.
- Les rôles et mots sont révélés à la fin de chaque manche. L’ordre de parole est tiré au sort à chaque nouvelle manche.
- Temps par indice et par vote : 10, 20, 30, 40, 60 secondes ou illimité. Mr White n’est pas implémenté.

### Mercato

- Chaque participant dispose de 250 € et de six emplacements : GB, DC, MC, ATT, Joker et Coach.
- L’ouverture des enchères alterne entre les joueurs. Celui qui ouvre doit miser ; l’adversaire peut surenchérir ou abandonner.
- Le montant maximal conserve 1 € pour chaque emplacement qui restera à remplir après l’achat. Les raccourcis ¼, ½, ¾ et Max préparent la mise, sans la valider.
- Le placement est libre : les recrues peuvent être déplacées ou permutées, indépendamment de leur poste naturel.
- Dès qu’une équipe est complète, les places restantes de l’adversaire sont remplies automatiquement à 1 € par recrue.
- Les équipes sont présentées sur des terrains pour les comparer. Il n’y a pas de score automatique attribué aux compositions.

### Défi Chrono

- Chaque manche tire une cible commune de 3 à 10 secondes et mélange l’ordre des joueurs.
- Chaque joueur démarre puis arrête son buzzer. Le mode difficile cache le compteur pendant l’essai.
- Le classement additionne les écarts absolus : le plus petit total gagne après 1 à 5 manches.
- Un essai passé ou expiré après 30 secondes ajoute 30 secondes d’écart.

</details>

## Stack

| Partie | Technologies |
| --- | --- |
| Interface | React, Vite, JavaScript, Tailwind CSS, composants shadcn/ui et Lucide |
| Serveur | Node.js, Express, Socket.io |
| Données | Catalogues JSON côté serveur ; rooms et sessions en mémoire |
| Tests | Test runner natif Node.js et clients Socket.io |
| Déploiement | Frontend Vercel ; backend Railway avec Docker |

## Architecture

```text
client/src/
├── App.jsx                 # Navigation et liaison avec la session
├── hooks/useRoom.js        # Socket.io, requêtes et reconnexion
├── components/             # Accueil, lobby et composants communs
│   ├── home/               # Catalogue des jeux, création et connexion
│   └── ui/                 # Primitives d’interface
└── games/
    ├── undercover/         # Tableau, carte secrète, votes et résultats
    ├── football/           # Terrains, enchères, budgets et placement
    └── chrono/             # Compteur, buzzer et classement

server/
├── scripts/                # Import du catalogue football
├── test/                   # Tests des règles et échanges réseau
└── src/
    ├── app.js              # Express et endpoint de santé
    ├── index.js            # Démarrage HTTP / Socket.io
    ├── socket/             # Événements et diffusion
    ├── rooms/              # Rooms, hôte, sessions et reconnexion
    ├── players/            # Identité et validation des pseudos
    └── games/              # Registre et règles propres à chaque jeu
```

**Une séparation par responsabilité.** Les composants affichent l’état et transmettent les actions. Le hook `useRoom` centralise les échanges réseau. Les modules serveur valident les actions et calculent les transitions de jeu.

**Des rooms indépendantes des jeux.** Création, code d’invitation, présence et droits de l’hôte sont communs. Chaque module expose ses paramètres, son état public et ses actions ; Undercover possède aussi une projection privée limitée au mot du joueur.

**Des secrets conservés sur le serveur.** L’état complet n’est jamais diffusé tel quel. Les rôles Undercover restent côté serveur jusqu’à la révélation finale, y compris lors d’une reconnexion.

**Une reprise de session.** Un jeton privé conservé dans `sessionStorage` permet de retrouver sa place dans le même onglet. Une coupure détectée met la partie en pause et réserve la place 60 secondes. Un départ volontaire ou une expiration ramène le groupe au lobby.

## Installation

Prérequis : **Node.js 22.x** et npm. Exécuter les commandes depuis la racine du dépôt.

```sh
npm ci
```

Démarrer le backend dans un terminal :

```sh
npm run dev:server
```

Démarrer le frontend dans un second terminal :

```sh
npm run dev:client
```

Ouvrir **http://localhost:5173**. Le backend écoute par défaut sur le port **3001** ; le proxy Vite relaie les appels API et Socket.io.

Aucune clé d’API ni base de données n’est nécessaire pour jouer avec les catalogues présents dans le dépôt. En local, laisser `VITE_SERVER_URL` absent ou vide pour utiliser le proxy. Les fichiers `.env.example` documentent la configuration ; ils ne sont pas chargés comme des fichiers `.env`.

### Jouer sur le réseau local

Remplacer le lancement du frontend par :

```sh
npm run dev:lan
```

Ouvrir l’adresse **Network** affichée par Vite depuis les appareils connectés au même réseau Wi-Fi. Garder le serveur et le client en cours d’exécution. La copie du code peut être indisponible en HTTP local ; le code reste sélectionnable.

## Vérification

```sh
npm run test --workspace server
npm run build
```

Les tests couvrent les rooms, les autorisations, les règles des trois jeux, les reconnexions, le filtrage des données et la confidentialité des échanges Socket.io. Certains ouvrent un port local.

Le build génère `client/dist`. Il ne remplace pas une validation de l’interface : avant une démonstration, tester une partie de chaque jeu sur plusieurs appareils, un rafraîchissement et un retour au lobby.

## Données

Les catalogues sont chargés côté serveur. Leur consultation pendant une partie ne nécessite pas d’appel à une API de données externe.

<details>
<summary><strong>Ajouter des paires Undercover</strong></summary>

Les paires sont dans `server/src/games/undercover/data/words.json` et `anime.json`. Le fichier `catalog.js` les rassemble.

Chaque paire possède :

| Champ | Usage |
| --- | --- |
| `id` | Identifiant stable et unique |
| `word1`, `word2` | Les deux mots associés |
| `themes` | Au moins un de ces thèmes doit être sélectionné |
| `requiredThemes` | Tous ces thèmes doivent être sélectionnés |
| `requiredUniverses` | Tous ces univers doivent être sélectionnés |
| `crossover` | Si vrai, nécessite l’option crossovers |
| `types` | Types des deux mots, facultatifs |
| `link` | Explication éditoriale de l’association, conservée côté serveur |

Exemple : **Ryuk / Pomme** peut relever des thèmes Anime et Nourriture, mais exige Anime et Death Note. Sélectionner seulement Nourriture ne suffit donc pas.

Utiliser les identifiants de thèmes et d’univers déjà présents dans les fichiers. Pour créer un nouveau catalogue, l’ajouter à la liste chargée par `catalog.js`. Relancer le serveur et les tests après modification.

</details>

<details>
<summary><strong>Importer les données et photos du Mercato</strong></summary>

Le catalogue est dans `server/src/games/football/data/players.json`. Un script enrichit les profils existants à partir de TheSportsDB :

```sh
# Simulation, sans écriture du catalogue
npm run data:football

# Import et enregistrement
npm run data:football -- --write
```

L’import conserve les identifiants et postes de jeu. Les homonymes et correspondances ambiguës nécessitent une vérification ; le rapport figure dans `server/src/games/football/data/import-report.json`.

Une clé personnelle peut être fournie via `THESPORTSDB_API_KEY`. Les photos restent des liens externes : le script ne les télécharge pas et leur disponibilité dépend de la source. Les requêtes d’images sont distinctes des appels à l’API d’import.

Ne pas lancer cet import à chaque room ni au déploiement. Relancer le serveur après une modification du catalogue.

</details>

## Déploiement

Le dépôt contient `vercel.json`, `railway.json` et un `Dockerfile`. Les deux services utilisent **la racine du dépôt**.

| Service | Configuration |
| --- | --- |
| **Vercel — frontend** | Build `npm run build`, sortie `client/dist`, variable `VITE_SERVER_URL` = URL HTTPS publique du backend |
| **Railway — backend** | Dockerfile, démarrage `npm start`, une seule réplique, variable `CLIENT_ORIGINS` = URL HTTPS stable du frontend |

Le serveur écoute sur `0.0.0.0` et utilise `PORT` fourni par l’environnement. Le port cible du domaine Railway doit correspondre au port réellement écouté.

Le endpoint `GET /api/health` retourne l’état du backend. Sa racine peut retourner 404 : le frontend est servi séparément.

`CLIENT_ORIGINS` accepte plusieurs origines séparées par des virgules et configure CORS ; ce n’est pas un mécanisme d’authentification. `VITE_SERVER_URL` est publique et intégrée au build : un changement nécessite de reconstruire le frontend. Saisir les variables dans les plateformes d’hébergement.

## Limites du MVP et prochaines étapes

- **Pas de persistance** : un redémarrage ou déploiement du serveur efface les rooms. L’architecture actuelle prévoit une seule instance serveur.
- **Chrono entre amis** : la durée est mesurée dans le navigateur puis validée par le serveur ; un client modifié peut tricher.
- **Validation frontend à compléter** : pas encore de suite de tests automatisés des parcours navigateur ni de script de lint.
- **Catalogues à enrichir** : certaines photos peuvent manquer ; l’équilibrage des paires et la prévention des répétitions restent à améliorer.
- **UX à alléger** : réduire les textes en jeu et regrouper les explications dans une aide accessible à la demande.

Les prochains travaux privilégient la fiabilité des parcours et la qualité des données avant l’ajout d’un quatrième jeu.
