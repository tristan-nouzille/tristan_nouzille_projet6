const apiUrlFilms = 'http://localhost:8000/api/v1/titles/'; // L'URL de l'API pour les films
const apiUrlFilmsByGenre = 'http://localhost:8000/api/v1/titles/?genre='
// Liste des genres à afficher
const genresToDisplay = ['biography', 'horror'];
// Fonction pour récupérer les films par genre avec gestion de la pagination
async function fetchFilmsByGenre(genre) {
    const apiUrl = `${apiUrlFilmsByGenre}${genre.toLowerCase()}`;

    let allFilms = [];  // Tableau pour stocker tous les films récupérés
    let nextPageUrl = apiUrl;  // Commencer avec l'URL de la première page

    try {
        // Continue de récupérer des pages tant qu'il y a une URL "next"
        while (nextPageUrl && allFilms.length < 6) {
            const response = await fetch(nextPageUrl);
            if (!response.ok) throw new Error(`Erreur de récupération des films pour "${genre}"`);
            
            const data = await response.json();
            const films = Array.isArray(data.results) ? data.results : [];

            // Ajouter les films récupérés à la liste
            allFilms = allFilms.concat(films);

            // Si moins de 6 films ont été récupérés, on récupère la page suivante
            nextPageUrl = data.next;
        }

        // Afficher les 6 premiers films (ou moins si pas assez)
        displayFilmImagesForGenre(genre, allFilms.slice(0, 6));

    } catch (error) {
        console.error(`Erreur dans la récupération des films pour le genre "${genre}" :`, error);
    }
}

// Fonction pour récupérer les films depuis l'API
// Fonction pour récupérer tous les films (avec pagination)
async function fetchData() {
    try {
        let allFilms = [];  // Tableau pour stocker tous les films récupérés
        let nextPageUrl = apiUrlFilms;  // Commencer avec l'URL de la première page

        // Continue de récupérer des pages tant qu'il y a une URL "next" ou que le nombre de films est insuffisant
        while (nextPageUrl) {
            const response = await fetch(nextPageUrl);
            if (!response.ok) throw new Error('Erreur de récupération des films');
            const data = await response.json();
            
            // Vérifier les films récupérés
            const films = Array.isArray(data.results) ? data.results : [];
            console.log("Films récupérés sur la page : ", films);

            // Ajouter les films récupérés à la liste
            allFilms = allFilms.concat(films);

            // Si on a récupéré suffisamment de films (par exemple 6), on s'arrête
            if (allFilms.length >= 6) {
                break;
            }

            // Si l'API retourne une page suivante, utiliser l'URL de la page suivante
            nextPageUrl = data.next;
        }

        // Afficher le premier film avec la meilleure note (par exemple)
        const topFilm = findTopFilm(allFilms); // Trouve le film le mieux noté
        displayTopFilm(topFilm);

        // Afficher les films les mieux notés
        displayTopRatedFilms(allFilms);

        // Si moins de 6 films ont été récupérés, on peut gérer ce cas ici
        if (allFilms.length < 6) {
            console.log("Il y a moins de 6 films disponibles.");
        }

    } catch (error) {
        console.error('Erreur dans la récupération des films :', error);
    }
}

// Fonction pour trouver le film le mieux noté
function findTopFilm(films) {
    return films.reduce((top, film) => {
        // Vérifie si le film actuel a une meilleure note ou un nombre de votes plus élevé
        if (!top || parseFloat(film.imdb_score) > parseFloat(top.imdb_score) ||
            (parseFloat(film.imdb_score) === parseFloat(top.imdb_score) && film.votes > top.votes)) {
            return film;
        }
        return top;
    }, null);
}

// Fonction pour afficher le film le mieux noté
function displayTopFilm(film) {
    const topFilmContent = document.getElementById('topFilmContent');
    if (film) {
        topFilmContent.innerHTML = `
            <div class="cadre container">
                <div>
                    <h2 class="text-col">${film.title} (${film.year})</h2>
                    <div class="toPimage">
                        <img src="${film.image_url}" class="topImg" alt="${film.title}">
                    </div>
                </div>
                <div class="text-col-p">
                    <p><strong>Description :</strong> ${film.description || 'Aucune description disponible.'}</p>
                </div>
                <div id="detailsButton">
                    <button class="btn-danger">Détails</button>
                </div>
            </div>
        `;
    } else {
        topFilmContent.innerHTML = '<p>Aucun film trouvé.</p>';
    }
}

// Fonction pour afficher les films les mieux notés (top 6)
function displayTopRatedFilms(films) {
    // Trier les films par note de manière décroissante (du mieux noté au moins bien noté)
    const topRatedFilms = films.sort((a, b) => b.rating - a.rating);
    
    // Sélectionner l'élément où les films seront affichés
    const ratedFilms = document.getElementById('ratedFilms');
    
    // Vider l'élément avant d'ajouter de nouveaux films
    ratedFilms.innerHTML = '';

    // Afficher les 6 premiers films dans l'élément
    for (let i = 0; i < 6; i++) {
        if (topRatedFilms[i]) { // Vérifie que l'index existe
            const film = topRatedFilms[i];
            const filmElement = document.createElement('div');
            filmElement.innerHTML = `
                <img src="${film.image_url}" alt="${film.title}">
            `;
            ratedFilms.appendChild(filmElement);
        }
    }
}

// Fonction pour afficher les images des films de chaque genre
function displayFilmImagesForGenre(genre, films) {
    const genreFilmsContainer = document.getElementById(`${genre}Films`); // Conteneur pour le genre, ex. 'biographyFilms'

    // Vider l'élément avant d'ajouter de nouveaux films
    genreFilmsContainer.innerHTML = '';  // Réinitialiser la section

    // Ajouter les images des films
    films.forEach(film => {
        const filmElement = document.createElement('div');
        // Créer l'élément pour l'image et l'ajouter
        filmElement.innerHTML = `
            <img src="${film.image_url}" alt="${film.title}" />
        `;
        genreFilmsContainer.appendChild(filmElement);
    });
}

// Appel de la fonction pour récupérer les films pour chaque genre de la liste
genresToDisplay.forEach(genre => {
    fetchFilmsByGenre(genre); // Appel pour chaque genre de la liste
});
// Appeler la fonction pour récupérer les données et afficher les films
fetchData();










