# Catalogues Undercover

Le moteur charge `words.json` et `anime.json` via `catalog.js`. Le catalogue Anime contient 100 propositions à éprouver en partie. La difficulté n’est plus un filtre.

- `id` : identifiant stable de la paire.
- `word1`, `word2` : mots secrets.
- `themes` : thèmes dans lesquels la paire peut être proposée ; au moins un doit être sélectionné.
- `requiredThemes` : connaissances spécialisées obligatoires ; tous doivent être sélectionnés.
- `requiredUniverses` : franchises obligatoires ; toutes doivent être sélectionnées.
- `crossover` : exige aussi l’option crossovers lorsqu’il vaut vrai.
- `types` : types des deux mots dans l’ordre (facultatif pour le catalogue classique).
- `link` : justification éditoriale privée, jamais envoyée aux clients.

Ryuk/Pomme appartient à Anime et Nourriture mais exige Anime et Death Note. Anime seul avec Death Note suffit ; Nourriture seule ne suffit jamais. Law/Chirurgien n’exige aucun thème Métiers. Saitama/Kratos exige Anime, Pop culture, One Punch Man et God of War.

Le lobby expose seulement les thèmes, univers et le nombre de paires disponibles. Une sélection vide de résultats peut être préparée mais ne peut pas être lancée. Les catalogues restent côté serveur ; seuls les mots attribués sont envoyés individuellement. La prévention des répétitions entre manches reste à développer.
