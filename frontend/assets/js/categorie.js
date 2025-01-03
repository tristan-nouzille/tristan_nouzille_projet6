import {
    fetchFilmsByGenre,
    fetchFilmDetails,
    showFilmDetails
} from './script.js';

let genreName;

// Fonction pour précharger les images
async function preloadImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(url);
        img.onerror = () => resolve('/frontend/assets/images/default-image.jpg.png');
    });
}

// Fonction pour stocker les données en sessionStorage en gérant le dépassement de quota
function safeSetItem(key, value) {
    try {
        sessionStorage.setItem(key, value);
    } catch (error) {
        if (error.name === "QuotaExceededError") {
            console.warn("Quota de sessionStorage dépassé. Nettoyage en cours...");
            sessionStorage.clear();
            sessionStorage.setItem(key, value);
        } else {
            console.error("Erreur lors de l'enregistrement dans sessionStorage :", error);
        }
    }
}

// Fonction pour afficher les films d'une page
async function displayFilmsForPage(genreName, currentPage, filmsPerPage = 24) {
    const offset = (currentPage - 1) * filmsPerPage;

    // Vérifier si les films sont déjà stockés dans sessionStorage
    let filmsByGenre = JSON.parse(sessionStorage.getItem(`films_${genreName}`));

    if (!filmsByGenre) {
        try {
            filmsByGenre = await fetchFilmsByGenre(genreName);
            safeSetItem(`films_${genreName}`, JSON.stringify(filmsByGenre));
        } catch (error) {
            console.error('Erreur lors de la récupération des films :', error);
            return;
        }
    }

    const sortedFilms = filmsByGenre.sort((a, b) => {
        const ratingA = parseFloat(a.imdb_score) || 0;
        const ratingB = parseFloat(b.imdb_score) || 0;
        return ratingB - ratingA;
    });

    const paginatedFilms = sortedFilms.slice(offset, offset + filmsPerPage);

    const filmsContainer = document.getElementById('filmsContainer');
    if (!filmsContainer) return;

    filmsContainer.innerHTML = '<p>Chargement des films...</p>';

    const filmElements = await Promise.all(
        paginatedFilms.map(async (film) => createFilmElement(film))
    );

    filmsContainer.innerHTML = '';
    const rowElement = document.createElement('div');
    rowElement.classList.add('row');

    filmElements.forEach((filmElement) => {
        const colElement = document.createElement('div');
        colElement.classList.add('col-12', 'col-sm-6', 'col-md-3', 'col-lg-2'); // Mise à jour pour 4 images par ligne en tablette
        colElement.appendChild(filmElement);
        rowElement.appendChild(colElement);
    });

    filmsContainer.appendChild(rowElement);
    updatePagination(currentPage, sortedFilms.length, filmsPerPage);

    lazyLoadImages();
}

// Fonction pour créer un élément HTML représentant un film
async function createFilmElement(film) {
    const filmElement = document.createElement('div');
    filmElement.classList.add('film-item', 'mb-3');

    const imageUrl = await preloadImage(film.image_url || '/frontend/assets/images/default-image.jpg.png');
    filmElement.innerHTML = `
        <div class="film-image-container">
            <img data-src="${imageUrl}" class="img-fluid lazy-image" alt="${film.title}" loading="lazy" onerror="this.src='/frontend/assets/images/default-image.jpg.png';">
            <div class="overlay">
                <h4>${film.title}</h4>
                <button data-film-id="${film.id}" class="btn btn-secondary btn-sm detailsButton">Détails</button>
            </div>
        </div>
    `;

    const detailsButton = filmElement.querySelector('.detailsButton');
    detailsButton.addEventListener('click', () => {
        fetchFilmDetails(film.id)
            .then(showFilmDetails)
            .catch((error) => {
                console.error('Erreur lors de la récupération des détails du film :', error);
            });
    });

    return filmElement;
}

// Fonction pour mettre à jour la pagination
function updatePagination(currentPage, totalFilms, filmsPerPage) {
    const totalPages = Math.ceil(totalFilms / filmsPerPage);
    const paginationElement = document.getElementById('pagination');

    if (!paginationElement) {
        console.error("L'élément avec l'ID 'pagination' est introuvable.");
        return;
    }

    paginationElement.innerHTML = '';

    const createButton = (label, isDisabled, onClick) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.classList.add('btn', 'btn-secondary', 'btn-sm');
        button.disabled = isDisabled;
        button.addEventListener('click', onClick);
        return button;
    };

    paginationElement.appendChild(
        createButton('Précédent', currentPage === 1, () => {
            updateURL(currentPage - 1);
            displayFilmsForPage(genreName, currentPage - 1, filmsPerPage);
        })
    );

    const pageNumber = document.createElement('span');
    pageNumber.classList.add('page-number', 'mx-3', 'text-white');
    pageNumber.textContent = `Page ${currentPage} sur ${totalPages}`;
    paginationElement.appendChild(pageNumber);

    paginationElement.appendChild(
        createButton('Suivant', currentPage === totalPages, () => {
            updateURL(currentPage + 1);
            displayFilmsForPage(genreName, currentPage + 1, filmsPerPage);
        })
    );
}

// Fonction pour mettre à jour l'URL sans recharger la page
function updateURL(pageNumber) {
    const currentURL = new URL(window.location.href);
    currentURL.searchParams.set('page', pageNumber);
    window.history.pushState({}, '', currentURL);
}

// Lazy loading avancé avec IntersectionObserver
function lazyLoadImages() {
    const images = document.querySelectorAll('img.lazy-image');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy-image');
                observer.unobserve(img);
            }
        });
    });

    images.forEach((img) => observer.observe(img));
}

// Lors de la récupération de la page
document.addEventListener('DOMContentLoaded', async () => {
    const filmsPerPage = 24;
    const urlParams = new URLSearchParams(window.location.search);
    genreName = urlParams.get('genre');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);

    if (!genreName) {
        console.error("Aucune catégorie spécifiée dans l'URL.");
        return;
    }

    const categoryTitle = document.getElementById('categoryTitle');
    if (categoryTitle) {
        categoryTitle.textContent = `Films pour la catégorie : ${genreName}`;
    }

    await displayFilmsForPage(genreName, currentPage, filmsPerPage);
});





























