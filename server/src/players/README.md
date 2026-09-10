# Joueurs

`index.js` valide le pseudo et crée un identifiant public indépendant de l'identifiant Socket.io. Les pseudos ont entre 2 et 24 caractères. La présence est gérée par les rooms : une session privée permet de retrouver cette identité après une coupure de moins de 60 secondes.
