import { fetchFilmDetails, showFilmDetails } from './script.js';

const apiUrlFilmsByGenre = 'http://localhost:8000/api/v1/titles/?genre=';
let genreName = ''; // Pas de genre par défaut
let currentPage = 1;
let totalFilms = 0;
const genreCache = new Map();
const filmsPerPage = 24;

// Précharger une image
async function preloadImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(url);
        img.onerror = () => resolve('/frontend/assets/images/default-image.jpg.png');
    });
}

// Afficher les films pour une page donnée
async function displayFilmsForPage(currentPage = 1, filmsPerPage = 24) {
    const offset = (currentPage - 1) * filmsPerPage;

    if (!genreName) {
        console.error('Aucun genre sélectionné. Veuillez choisir un genre pour afficher les films.');
        showError('Veuillez sélectionner une catégorie pour afficher les films.');
        return;
    }

    console.log(`Genre sélectionné : ${genreName}, Page : ${currentPage}, Offset : ${offset}`);
    
    try {
        console.log(`Chargement des films pour le genre: ${genreName}, page: ${currentPage}, offset: ${offset}`);
        
        // Forcer la récupération des films depuis l'API en ignorant le cache
        const { films = [], totalPages } = await fetchFilmsByGenre(genreName, filmsPerPage, offset, true);  // `true` pour ignorer le cache

        if (films.length === 0) {
            console.log('Aucun film trouvé pour cette catégorie.');
            showError('Aucun film trouvé pour cette catégorie.');
            return;
        }

        console.log(`Films récupérés pour le genre ${genreName}:`, films);
        renderFilms(films);
        updatePagination(currentPage, totalPages);
        lazyLoadImages();
    } catch (error) {
        console.error('Erreur lors de la récupération des films :', error);
        showError('Erreur lors du chargement des films. Veuillez réessayer plus tard.');
    }
}

// Gérer la récupération des films par genre
async function fetchFilmsByGenre(genre, limit = null, offset = 0, ignoreCache = false) {
    console.log(`Requête pour le genre: ${genre}, offset: ${offset}, limit: ${limit}`);

    if (!genre || typeof genre !== 'string' || genre.trim() === '') {
        console.error('Aucun genre fourni ou genre invalide.');
        return [];
    }

    // Si l'option ignoreCache est activée, forcer la récupération depuis l'API
    if (!ignoreCache && genreCache.has(genre)) {
        const cachedFilms = genreCache.get(genre);
        console.log('Films récupérés depuis le cache');
        return cachedFilms.slice(offset, offset + limit);
    }

    const films = [];
    let totalFilms = 0;
    let nextPageUrl = `${apiUrlFilmsByGenre}${encodeURIComponent(genre.trim())}&ordering=-imdb_score&limit=${limit}&offset=${offset}`;

    while (nextPageUrl) {
        try {
            console.log(`Requête API pour ${nextPageUrl}`);
            const response = await fetch(nextPageUrl);
            if (!response.ok) throw new Error(`Erreur lors de la récupération des films pour "${genre}"`);

            const data = await response.json();
            console.log('Données API récupérées:', data);

            if (data.results && Array.isArray(data.results)) {
                films.push(...data.results);
            }

            totalFilms = data.count; // Mettre à jour le nombre total de films
            nextPageUrl = data.next; // Suivant

            // Si on a atteint la limite de films souhaitée, sortir de la boucle
            if (films.length >= offset + limit) {
                break;
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération des films pour "${genre}" :`, error);
            break;
        }
    }

    // Mettre en cache les films récupérés, mais uniquement si on n'ignore pas le cache
    if (!ignoreCache) {
        genreCache.set(genre, films);
    }

    // Calcul du total de pages
    const totalPages = Math.ceil(totalFilms / limit);

    return { films: films.slice(offset, offset + limit), totalPages };
}

// Afficher les films dans le conteneur
function renderFilms(films) {
    const filmsContainer = document.getElementById('filmsContainer');
    if (!filmsContainer) return;

    filmsContainer.innerHTML = '';
    const rowElement = document.createElement('div');
    rowElement.classList.add('row');

    // Vérifier si le nombre de films est inférieur à 24
    const isSmallCategory = films.length < 24;

    films.forEach((film) => {
        const colElement = document.createElement('div');
        colElement.classList.add('col-12', 'col-sm-6', 'col-md-3', 'col-lg-2');
        const filmElement = createFilmElement(film);

        // Si c'est une catégorie avec moins de 24 films, agrandir l'image en ajustant ses dimensions
        if (isSmallCategory) {
            const img = filmElement.querySelector('img');
            img.style.width = '1000px';  // Agrandir l'image à 100% de la largeur du conteneur
            img.style.height = 'auto'; // Garder l'aspect ratio
        }

        colElement.appendChild(filmElement);
        rowElement.appendChild(colElement);
    });

    filmsContainer.appendChild(rowElement);
}

// Créer un élément HTML pour un film
function createFilmElement(film) {
    const filmElement = document.createElement('div');
    filmElement.classList.add('film-item', 'mb-3', 'fade-in');

    filmElement.innerHTML = `
        <div class="film-image-container">
            <img data-src="${film.image_url || preloadImage}" 
                 class="img-fluid lazy-image" 
                 alt="${film.title}" 
                 loading="lazy" 
                 onerror="this.src='/frontend/assets/images/default-image.jpg.png';">
            <div class="overlay">
                <h4>${film.title}</h4>
                <button data-film-id="${film.id}" class="btn btn-secondary btn-sm detailsButton">Détails</button>
            </div>
        </div>
    `;

    filmElement.querySelector('.detailsButton').addEventListener('click', () => {
        fetchFilmDetails(film.id)
            .then(showFilmDetails)
            .catch((error) => {
                console.error('Erreur lors de la récupération des détails du film :', error);
            });
    });

    return filmElement;
}

// Mettre à jour la pagination
function updatePagination(currentPage, totalPages) {
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement) return;

    paginationElement.innerHTML = '';

    const createButton = (label, isDisabled, onClick) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.classList.add('btn', 'btn-secondary', 'btn-sm');
        button.disabled = isDisabled;
        button.addEventListener('click', onClick);
        return button;
    };

    const prevPageButton = createButton('Précédent', currentPage === 1, () => {
        if (currentPage > 1) {
            currentPage -= 1;
            updateURL(currentPage);
            displayFilmsForPage(currentPage, filmsPerPage);
        }
    });

    const pageNumber = document.createElement('span');
    pageNumber.classList.add('page-number', 'mx-3', 'text-white');
    pageNumber.textContent = `Page ${currentPage}`;

    const nextPageButton = createButton('Suivant', currentPage >= totalPages, () => {
        if (currentPage < totalPages) {
            currentPage += 1;
            updateURL(currentPage);
            displayFilmsForPage(currentPage, filmsPerPage); // Forcer le chargement de la page suivante
        }
    });

    paginationElement.appendChild(prevPageButton);
    paginationElement.appendChild(pageNumber);
    paginationElement.appendChild(nextPageButton);
}

function updateURL(currentPage) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('genre', genreName);  // Assurez-vous que genreName est toujours disponible
    urlParams.set('page', currentPage); // Mettre à jour la page dans l'URL
    window.history.pushState({}, '', '?' + urlParams.toString());  // Mise à jour de l'URL sans recharger la page
}

// Lazy loading des images avec amélioration de la fluidité
function lazyLoadImages() {
    const images = document.querySelectorAll('img.lazy-image');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(async (entry) => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const preloadedImage = await preloadImage(img.dataset.src);
                img.src = preloadedImage;
                observer.unobserve(img);
            }
        });
    }, { threshold: 0.5 });

    images.forEach((image) => {
        observer.observe(image);
    });
}

// Afficher une erreur
function showError(message) {
    const errorMessage = document.createElement('div');
    errorMessage.classList.add('alert', 'alert-danger', 'error-message');
    errorMessage.textContent = message;

    const filmsContainer = document.getElementById('filmsContainer');
    filmsContainer.innerHTML = '';
    filmsContainer.appendChild(errorMessage);
}

// Event listener pour charger les films au démarrage
document.addEventListener('DOMContentLoaded', () => {
    genreName = new URLSearchParams(window.location.search).get('genre') || 'action'; // Récupérer le genre depuis l'URL ou utiliser un genre par défaut
    currentPage = parseInt(new URLSearchParams(window.location.search).get('page')) || 1; // Récupérer la page ou mettre 1 par défaut
    displayFilmsForPage(currentPage, filmsPerPage);
});


export { displayFilmsForPage, updateURL };































































































