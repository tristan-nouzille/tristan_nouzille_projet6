import {
    fetchFilmsByGenre,
    toggleSidebar,
    fetchFilmDetails,
    showFilmDetails
} from './script.js';

// Fonction pour créer un élément HTML représentant un film
function createFilmElement(film) {
    const filmElement = document.createElement('div');
    filmElement.classList.add('film-item');
    filmElement.style.padding = '10px';

    const imageUrl = film.image_url || '/frontend/assets/images/default-image.jpg.png';

    filmElement.innerHTML = `
        <img src="${imageUrl}" class="img-fluid" alt="${film.title}" loading="lazy" onerror="this.src='/frontend/assets/images/default-image.jpg.png';">
        <div class="overlay">
            <p>${film.title}</p>
            <button data-film-id="${film.id}" class="btn btn-secondary btn-sm detailsButton">
                Détails
            </button>
        </div>
    `;

    // Ajouter un événement au bouton "Détails"
    const detailsButton = filmElement.querySelector('.detailsButton');
    detailsButton.addEventListener('click', () => {
        fetchFilmDetails(film.id).then(filmDetails => {
            showFilmDetails(filmDetails);
        }).catch(error => {
            console.error('Erreur lors de la récupération des détails du film :', error);
        });
    });

    return filmElement;
}

// Fonction pour afficher les films pour la page donnée
async function displayFilmsForPage(genreName, currentPage, filmsPerPage) {
    try {
        // Récupérer les films du genre spécifié
        const filmsByGenre = await fetchFilmsByGenre(genreName);

        // Calcul de l'index de départ et d'arrêt pour la pagination
        const startIndex = (currentPage - 1) * filmsPerPage;
        const paginatedFilms = filmsByGenre.slice(startIndex, startIndex + filmsPerPage);

        const filmsContainer = document.getElementById('filmsContainer');
        if (filmsContainer) {
            filmsContainer.innerHTML = '';  // Effacer le contenu précédent

            // Ajouter chaque film à l'élément container
            paginatedFilms.forEach(film => {
                const filmElement = createFilmElement(film);
                filmsContainer.appendChild(filmElement);
            });

            // Mettre à jour la pagination
            updatePagination(currentPage, filmsByGenre.length, filmsPerPage);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des films par genre :', error);
    }
}

// Fonction pour mettre à jour la pagination avec Bootstrap
function updatePagination(currentPage, totalFilms, filmsPerPage) {
    const totalPages = Math.ceil(totalFilms / filmsPerPage);
    const paginationContainer = document.getElementById('paginationContainer');

    if (paginationContainer) {
        paginationContainer.innerHTML = '';  // Effacer la pagination précédente

        // Création de la structure de la pagination Bootstrap
        const paginationList = document.createElement('ul');
        paginationList.classList.add('pagination');

        // Ajouter le bouton "Précédent"
        const prevPage = document.createElement('li');
        prevPage.classList.add('page-item');
        if (currentPage === 1) {
            prevPage.classList.add('disabled');
        }
        prevPage.innerHTML = `
            <a class="page-link" href="#" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
                <span class="sr-only">Previous</span>
            </a>
        `;
        prevPage.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) displayFilmsForPage(genreName, currentPage - 1, filmsPerPage);
        });

        // Ajouter les pages numérotées
        for (let i = 1; i <= totalPages; i++) {
            const pageItem = document.createElement('li');
            pageItem.classList.add('page-item');
            if (i === currentPage) {
                pageItem.classList.add('active');
            }
            pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageItem.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                displayFilmsForPage(genreName, i, filmsPerPage);
            });
            paginationList.appendChild(pageItem);
        }

        // Ajouter le bouton "Suivant"
        const nextPage = document.createElement('li');
        nextPage.classList.add('page-item');
        if (currentPage === totalPages) {
            nextPage.classList.add('disabled');
        }
        nextPage.innerHTML = `
            <a class="page-link" href="#" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
                <span class="sr-only">Next</span>
            </a>
        `;
        nextPage.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) displayFilmsForPage(genreName, currentPage + 1, filmsPerPage);
        });

        // Ajouter la pagination à son container
        paginationList.appendChild(prevPage);
        paginationList.appendChild(nextPage);
        paginationContainer.appendChild(paginationList);
    }
}

// Initialisation principale
document.addEventListener('DOMContentLoaded', async () => {
    const filmsPerPage = 24;  // Nombre de films à afficher par page
    let currentPage = 1;  // Page actuelle

    // Gestion du bouton de la barre latérale
    const sidebarToggleButton = document.getElementById('menuButton');
    if (sidebarToggleButton) {
        sidebarToggleButton.addEventListener('click', toggleSidebar);
    }

    // Récupérer le genre depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const genreName = urlParams.get('genre');
    if (!genreName) {
        console.error("Aucune catégorie spécifiée dans l'URL.");
        return;
    }

    // Mettre à jour le titre de la catégorie
    const categoryTitle = document.getElementById('categoryTitle');
    if (categoryTitle) {
        categoryTitle.textContent = `Films pour la catégorie : ${genreName}`;
    }

    // Afficher les films pour la première page
    await displayFilmsForPage(genreName, currentPage, filmsPerPage);
});



















