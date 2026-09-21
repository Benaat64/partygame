# Undercover

index.js valide les paramètres et distribue les rôles. rounds.js gère les tours d'indices/vote, éliminations, délais et scores. Les données restent dans data/words.json côté serveur, à partir de la [référence demandée](https://undercover.gg/fr/words).

Une partie comprend 1 à 5 manches avec redistribution ; chaque manche commence par deux tours d’indices avant le premier vote. Une égalité ou une élimination sans victoire ouvre un nouveau tour d’indices puis un vote, sans limite de tours. Temps par joueur pour son indice, puis durée du vote : 10, 20, 30, 40 ou 60 secondes, ou Illimité (phaseSeconds: null, sans échéance). Valeurs par défaut : 3 manches et 30 secondes.

Les Civils gagnent la manche quand tous les Undercover sont éliminés ; les Undercover gagnent à parité ou à la limite de tours. Une égalité de votes n'élimine personne. Points accordés une seule fois à toute l'équipe gagnante, même éliminée : Civil +2, Undercover +3.

Les cartes sont privées jusqu'à la fin de leur manche. next prépare la distribution suivante, réinitialise les actions et les survivants, conserve scores et historique. Le classement final autorise les ex æquo. Aucun Mr White.

### Ordre des indices

Le serveur mélange les joueurs indépendamment des rôles à chaque nouvelle manche. Cet ordre reste identique entre les tours de la manche, en sautant les éliminés. Le tirage peut désigner à nouveau le même premier joueur. Seul le joueur désigné peut envoyer un indice. Le délai configuré s’applique à chaque joueur individuellement : un envoi ou une expiration passe au suivant. En mode illimité, seul l’envoi fait avancer. Après le dernier joueur, tous les survivants votent simultanément avec un délai collectif. La reconnexion conserve le joueur attendu et le temps restant.
