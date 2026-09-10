# Rooms

`store.js` gère les rooms en mémoire : code aléatoire de 6 caractères, hôte, membres et cycle de vie. Une connexion ne peut appartenir qu'à une room. Le premier membre restant devient hôte au départ de l'hôte ; une room vide est supprimée.

Les règles sont déléguées au module de jeu. Les snapshots publics contiennent le code, l'hôte, les identifiants/pseudos, le statut, le jeu, l'identifiant de partie, les paramètres et les options publiques. L'état de jeu privé reste séparé.

Seul l'hôte peut configurer, lancer ou réinitialiser une partie. Toute arrivée pendant une partie est refusée. Une coupure réserve la place 60 secondes et met la room en pause ; une reprise restaure l’identité et l’état, via un jeton privé. Un départ volontaire ou l’expiration du délai annule la partie.
