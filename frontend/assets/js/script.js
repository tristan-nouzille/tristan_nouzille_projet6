const apiUrlFilms = 'http://localhost:8000/api/v1/titles/'; // L'URL de l'API pour les films
const apiUrlGenres = 'http://127.0.0.1:8000/api/v1/genres/'; // L'URL de l'API pour les genres

// Fonction pour récupérer l'ID du genre "Action" depuis l'API
async function fetchGenreId(genreName) {
    try {
        const response = await fetch(apiUrlGenres);
        if (!response.ok) throw new Error('Erreur de récupération des genres');
        const data = await response.json();
        
        // Chercher l'ID du genre "Action"
        const actionGenre = data.results.find(genre => genre.name.toLowerCase() === genreName.toLowerCase());
        return actionGenre ? actionGenre.id : null; // Retourne l'ID du genre "Action" ou null si non trouvé
    } catch (error) {
        console.error('Erreur dans la récupération des genres :', error);
        return null;
    }
}

// Fonction pour récupérer les films depuis l'API
async function fetchData() {
    try {
        const genreId = await fetchGenreId('Action'); // Récupérer l'ID du genre "Action"
        if (!genreId) throw new Error('Genre "Action" non trouvé');
        
        const response = await fetch(apiUrlFilms);
        if (!response.ok) throw new Error('Erreur de récupération des films');
        const data = await response.json();
        
        // Vérifier les films récupérés
        const films = Array.isArray(data.results) ? data.results : [];
        console.log("Films récupérés :", films);
        const topFilm = findTopFilm(films); // Affiche les films récupérés
        displayTopFilm(topFilm);
        displayTopRatedFilms(films);
        // Affichage des films de la catégorie Action
        displayActionFilmsInCarousel(films, genreId);

    } catch (error) {
        console.error('Erreur :', error);
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
            films.filter(film => film.rating >= 9.0 && film.rating <= 9.7);
            const filmElement = document.createElement('div');
            filmElement.innerHTML = `
                <img src="${film.image_url}" alt="${film.title}">
            
            `;
            ratedFilms.appendChild(filmElement);
        }
    }
}

// Fonction pour afficher les films d'action dans un carrousel
function displayActionFilmsInCarousel(films, genreId) {
    // Filtrer les films de genre "Action" en utilisant l'ID du genre
    const actionFilms = films.filter(film => film.genres && film.genres.includes(genreId));
    // Afficher dans la console les films extraits de la catégorie "Action"
    console.log("Films de la catégorie Action :", actionFilms);
    // Sélectionner l'élément du carrousel où les films seront affichés
    const carouselItems = document.getElementById('carouselItems');
    const carouselIndicators = document.getElementById('carouselIndicators');

    // Vider l'élément avant d'ajouter de nouveaux films
    carouselItems.innerHTML = '';
    carouselIndicators.innerHTML = '';

    // Créer un élément pour chaque film d'action
    actionFilms.forEach((film, index) => {
        // Créer l'élément pour chaque film
        const filmElement = document.createElement('div');
        filmElement.classList.add('carousel-item');
        if (index === 0) filmElement.classList.add('active'); // Le premier élément sera actif
        filmElement.innerHTML = `
            <img src="${film.image_url}" class="d-block w-100" alt="${film.title}">
        `;
        
        // Ajouter l'élément au carrousel
        carouselItems.appendChild(filmElement);

        // Créer les indicateurs pour le carrousel
        const indicator = document.createElement('li');
        indicator.setAttribute('data-target', '#actionCarousel');
        indicator.setAttribute('data-slide-to', index);
        if (index === 0) indicator.classList.add('active'); // Le premier indicateur est actif
        carouselIndicators.appendChild(indicator);
    });

    // Mettre en place la logique du carrousel si nécessaire
    setupCarousel();
}

// Fonction pour mettre en place la logique du carrousel (en option)
function setupCarousel() {
    const prevBtn = document.querySelector('.carousel-control-prev');
    const nextBtn = document.querySelector('.carousel-control-next');

    // Gérer le carrousel manuellement si nécessaire (la logique de Bootstrap fonctionne normalement sans cela)
    prevBtn.addEventListener('click', () => console.log('Précédent'));
    nextBtn.addEventListener('click', () => console.log('Suivant'));
}

// Appeler la fonction pour récupérer les données et afficher les films
fetchData();







