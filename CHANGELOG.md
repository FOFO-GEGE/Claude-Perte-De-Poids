# Corrections — juillet 2026

## Fonctionnel
- **Courbe jour par jour** : la trajectoire est simulée jour après jour (7700 kcal ≈ 1 kg) au lieu d'une droite basée sur une moyenne. Les jours **futurs renseignés (prévisionnel)** sont pris en compte ; les jours non renseignés utilisent le budget théorique.
- **Deux tracés** : ligne théorique **fixe** (référence) + courbe de projection **pilotée par les calories**, qui se décale à chaque écart.
- **Dates ancrées** : date de début et date d'objectif théorique stockées (`wl-plan`), avec bouton « Replanifier à partir d'aujourd'hui ».
- **Recherche d'aliments manuelle** : plus d'appel API à chaque frappe. Bouton « Rechercher » (ou Entrée) → une seule requête. Tri de pertinence ajouté.
- **Pesée du jour facultative** : n'influence plus la courbe, s'affiche comme point de contrôle.

## Bugs corrigés
- Fuseau horaire : `fmt()` passe de `toISOString()` (UTC) à l'heure locale.
- Sélecteur Trait / Aire / Pointillé désormais réellement appliqué.
- Chemins d'icône : `./icons/icon.svg` → `./icon.svg` (index.html, sw.js, manifest.json).
- Champs numériques : saisie libre + validation au blur, virgule décimale acceptée, champ effaçable.
- Suppression des 3 repas de démo injectés automatiquement.
- Service worker en **network-first** : les modifications de code se propagent sans changer de numéro de version. `addAll` remplacé par une mise en cache tolérante aux fichiers manquants.
- Repli sur la base locale si l'API renvoie 0 résultat (et plus seulement en cas d'erreur réseau).
- Message distinct en cas de perte de connexion.
- IDs de repas uniques ; animation basée sur le dernier ajout au lieu de `id > 1000`.
- Point « aujourd'hui » n'est plus dessiné en double.
- Mois du calendrier calculé sur les éléments réels au lieu d'une largeur codée en dur.

## Simplifications
- Suppression du code mort (`ratio`, `pressure`, `avgEaten`, `pastLoggedDays`).
- Helper unique `dayOffset()` (fin de la duplication du calcul de dates).
- Poids de départ : source de vérité unique (`profile.weight`).
- Calendrier réduit de 361 à 91 jours (30 passés / 60 futurs).
- `MONTH_FR` / `DAY_FR` sortis en constantes partagées.

## Non traité (volontairement)
- Stockage toujours en `localStorage` (pas de base en ligne).
- React + Babel toujours compilés dans le navigateur.
- Scan de code-barres et reconnaissance photo non implémentés.

# Itération 2 — lisibilité de la courbe, portions, édition

## Courbe
- **Vue 30 jours par défaut** + bouton « Tout voir ». Sur 30 jours l'échelle Y se recalcule sur la fenêtre visible : la divergence entre théorique et projeté devient réellement visible (≈1,7 kg d'amplitude au lieu de 15).
- **Marqueurs de fin distincts** : cercle creux « TH » (théorique) / cercle plein « PROJ » (projeté).
- **Encart récapitulatif sous le graphe** : date théorique, date projetée, et écart en jours (« +5 j de retard » / « −3 j d'avance »). C'est là qu'est l'information, le point de fin sur l'axe étant illisible à 1 % de la largeur.
- Découpage (clipPath) des tracés à la fenêtre visible.

## Rythme de perte
- Affichage des **deux valeurs côte à côte** : « kg/sem moyen » (cohérent avec les jours restants) et « 7 prochains j » (pente locale). L'incohérence apparente entre −0,70 kg/sem et 228 j est levée.

## Repas
- **Modification d'un repas** : toucher la ligne ouvre la feuille en mode édition (nom, quantité, unité, ou remplacement de l'aliment). Boutons Enregistrer / Supprimer.
- **Portions** en plus des grammes, lues depuis Open Food Facts (`serving_quantity` / `serving_size`). Bascule Grammes / Portion, préréglages ×0,5 à ×3, et saisie libre de la quantité dans les deux unités.
- La base locale n'ayant pas de notion de portion, l'option est désactivée sur ces aliments (choix assumé, pas d'enrichissement de `food-db.js`).
- Chaque repas mémorise désormais kcal/100 g, quantité et unité → le recalcul est possible à l'édition. Les repas saisis avant cette version basculent sur une édition directe des calories.
- La quantité s'affiche sous le nom du repas dans la liste.
