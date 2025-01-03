const apiUrlFilms = 'http://localhost:8000/api/v1/titles/';  // URL de l'API pour récupérer tous les films
const apiUrlFilmsByGenre = 'http://localhost:8000/api/v1/titles/?genre=';  // URL pour récupérer les films par genre
const currentPage = window.location.pathname;  // Utilisation de window.location.pathname pour déterminer la page actuelle

const genresToDisplay = ['biography', 'horror'];  // Genres à afficher sur la page d'accueil
fetchAndDisplayGenres(genresToDisplay);  // Chargement des films pour les genres spécifiés

// Fonction pour basculer la visibilité de la barre latérale
export function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.querySelector("main");

    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
        mainContent.style.marginLeft = "0";
    } else {
        sidebar.style.width = "250px";
        mainContent.style.marginLeft = "250px";
    }

    fetchAllCategories();  // Récupère toutes les catégories lors de l'ouverture de la barre latérale
}

document.addEventListener("DOMContentLoaded", () => {
    fetchAllCategories();  // Charge les catégories dès le chargement de la page
    document.getElementById("menuButton").addEventListener("click", toggleSidebar);  // Ajoute l'événement au bouton du menu
});

// Fonction pour récupérer et afficher toutes les catégories disponibles
export async function fetchAllCategories() {
    const allCategories = [];  // Initialisation du tableau pour stocker les catégories récupérées
    const apiUrl = 'http://localhost:8000/api/v1/genres/';
    let nextPageUrl = apiUrl;

    try {
        // Charger les données paginées
        while (nextPageUrl) {
            const response = await fetch(nextPageUrl);
            if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

            const data = await response.json();

            if (data.results && Array.isArray(data.results)) {
                allCategories.push(...data.results);  // Ajoute les catégories au tableau
            } else {
                console.warn("La réponse de l'API ne contient pas de 'results' ou ce n'est pas un tableau.");
            }

            nextPageUrl = data.next;  // Passe à la page suivante s'il y en a une
        }

        const categoriesList = document.getElementById('categoriesList');
        if (categoriesList) {
            categoriesList.innerHTML = '';  // Nettoie la liste avant de la remplir

            if (allCategories.length === 0) {
                categoriesList.innerHTML = '<p>Aucune catégorie trouvée.</p>';
            } else {
                allCategories.forEach(genre => {
                    const p = document.createElement('p');
                    p.textContent = genre.name;
                    p.classList.add('category-item');

                    p.addEventListener('click', () => {
                        console.log(`Catégorie sélectionnée : ${genre.name}`);
                        handleCategorySelection(genre);
                    });

                    categoriesList.appendChild(p);  // Ajoute chaque catégorie à la liste
                });
            }
        } else {
            console.error('Élément "categoriesList" non trouvé dans le DOM.');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories :', error);
    }
}

// Fonction pour gérer la sélection d'une catégorie
export function handleCategorySelection(genre) {
    const genreName = encodeURIComponent(genre.name);  // Encode le nom du genre pour éviter les erreurs d'URL
    window.location.href = `/frontend/src/pages/category.html?genre=${genreName}`;  // Redirige vers la page de catégorie
}

// Fonction pour récupérer et afficher les films en fonction des genres sélectionnés
export async function fetchAndDisplayGenres(genresToDisplay, selectedGenre = null) {
    if (!Array.isArray(genresToDisplay)) {
        console.error('genresToDisplay n\'est pas un tableau.', genresToDisplay);
        return;
    }

    // Si un genre est sélectionné, on affiche les films pour ce genre
    if (selectedGenre) {
        console.log(`Chargement des films pour "${selectedGenre}"...`);
        await fetchFilmsByGenre(selectedGenre, null);
        return;
    }

    // Vérifier si l'on est sur la page index.html
    if (window.location.pathname === '/frontend/src/index.html' || window.location.pathname === '/') {
        // Si nous sommes sur la page index.html, exécuter la boucle
       for (const genre of genresToDisplay) {
            console.log(`Chargement des films pour "${genre}" (limité à 18)...`);
            await fetchFilmsByGenre(genre, 18);  // Limite à 18 films par genre
        }
        
    }
}

// Fonction pour récupérer les films par genre avec gestion de la pagination
export async function fetchFilmsByGenre(genre, limit = null) {
    if (!genre || genre.trim() === '') {
        console.error("Aucun genre sélectionné.");
        return [];
    }

    const apiUrl = `${apiUrlFilmsByGenre}${genre}&ordering=-imdb_score`;  // Trie par score IMDb décroissant
    let allFilms = [];
    let nextPageUrl = apiUrl;

    try {
        while (nextPageUrl && (limit === null || allFilms.length < limit)) {
            const response = await fetch(nextPageUrl);

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des films pour "${genre}", code: ${response.status}`);
            }

            const data = await response.json();

            if (!data.results || !Array.isArray(data.results)) {
                throw new Error(`Pas de films trouvés pour "${genre}" dans la réponse de l'API.`);
            }

            allFilms = allFilms.concat(data.results);  // Ajoute les films récupérés à la liste

            nextPageUrl = data.next;  // Mise à jour de l'URL pour la page suivante
        }

        console.log(`Films récupérés pour "${genre}" : ${allFilms.length} films`);

        // Affichage des films dans le carrousel (fonction à définir selon la structure de ton HTML)
        displayFilmsInCarousel(genre, allFilms);  // Affiche les films dans le carrousel
        return allFilms;
    } catch (error) {
        console.error(`Erreur dans la récupération des films pour "${genre}" :`, error);
        return [];
    }
}

// Fonction pour récupérer tous les films avec pagination
export async function fetchData() {
    try {
        let allFilms = [];
        let nextPageUrl = apiUrlFilms;

        while (nextPageUrl) {
            const response = await fetch(nextPageUrl);
            if (!response.ok) throw new Error('Erreur de récupération des films');

            const data = await response.json();
            const films = Array.isArray(data.results) ? data.results : [];

            allFilms = allFilms.concat(films);

            if (allFilms.length >= 18) {
                break;
            }

            nextPageUrl = data.next;  // Mise à jour pour la page suivante
        }

        if (currentPage === '/frontend/src/index.html' || currentPage === '/') {
            const topFilm = findTopFilm(allFilms);
            displayTopFilm(topFilm);  // Affiche le film le mieux noté

            displayTopRatedFilms(allFilms);  // Affiche les films les mieux notés
        }

        if (allFilms.length < 6) {
            console.log("Il y a moins de 6 films disponibles.");
        }
    } catch (error) {
        console.error('Erreur dans la récupération des films :', error);
    }
}

// Fonction pour récupérer les détails d'un film spécifique
export async function fetchFilmDetails(filmId) {
    const filmUrl = `http://localhost:8000/api/v1/titles/${filmId}`;
    try {
        const response = await fetch(filmUrl);
        if (!response.ok) throw new Error('Erreur de récupération des détails du film');
        return await response.json();  // Retourne les détails du film
    } catch (error) {
        console.error('Erreur lors de la récupération des détails du film:', error);
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
async function displayTopFilm(film) {
    const topFilmContent = document.getElementById('topFilmContent');
    console.log("Film dans displayTopFilm : ", film);  // Vérifiez que l'objet film contient bien la description

    if (film) {
        // Récupérer les détails complets du film, y compris la description
        const filmDetails = await fetchFilmDetails(film.id);

        // Vérifier si filmDetails contient la description
        const descriptionToDisplay = filmDetails.description || 'Aucune description disponible.';

        // Vérification de l'URL de l'image du film
        const imageUrl = film.image_url || '/frontend/assets/images/default-image.jpg.png';  // Image par défaut si l'URL est manquante ou invalide

        topFilmContent.innerHTML = `
            <div class="cadre container">
                <div>
                    <h2>${film.title} (${film.year})</h2>
                    <div class="toPimage">
                        <img src="${imageUrl}" class="topImg" alt="${film.title}" onerror="this.src='/frontend/assets/images/default-image.jpg.png';">
                    </div>
                </div>
                <div class="text-col-p">
                    <p><strong>Description :</strong> ${descriptionToDisplay}</p>
                </div>
                <div>
                    <button id="detailsButton${film.id}" class="btn-dangerD">Détails</button>
                </div>
            </div>
        `;

        // Attacher l'eventListener au bouton "Détails" après la mise à jour du DOM
        const detailsButton = document.getElementById(`detailsButton${film.id}`);
        if (detailsButton) {
            detailsButton.addEventListener('click', function() {
                showFilmDetails(film);
            });
        }
    } else {
        topFilmContent.innerHTML = '<p>Aucun film trouvé.</p>';
    }
}

export function showFilmDetails(film) {
    console.log("Film reçu dans showFilmDetails : ", film); // Affiche l'objet film complet

    if (!film) {
        console.error("Film introuvable dans showFilmDetails");
        return;
    }

    const filmDetailsContent = document.getElementById('filmDetailsContent');

    if (filmDetailsContent) {
        // Appeler fetchFilmDetails pour récupérer les détails complets du film, y compris la description
        fetchFilmDetails(film.id).then(filmDetails => {
            if (filmDetails) {
                // Vérifiez si la description est dans filmDetails
                const descriptionToDisplay = filmDetails.description || filmDetails.long_description || 'Aucune description disponible.';
                console.log("Description récupérée : ", descriptionToDisplay); // Affiche la description dans la console

                // Vérifier si l'URL de l'image est valide, sinon utiliser l'image par défaut
                const imageUrl = filmDetails.image_url || '/frontend/assets/images/default-image.jpg.png';  // Image par défaut

                filmDetailsContent.innerHTML = `
                    <h4>${filmDetails.title} (${filmDetails.year})</h4>
                    <img src="${imageUrl}" class="img-fluid" alt="${filmDetails.title}" onerror="this.src='/frontend/assets/images/default-image.jpg.png';">
                    <p><strong>Description :</strong> ${descriptionToDisplay}</p>
                    <p><strong>Note IMDb :</strong> ${filmDetails.imdb_score}</p>
                    <p><strong>Votes :</strong> ${filmDetails.votes}</p>
                    <p><strong>Réalisateur :</strong> ${filmDetails.directors.join(', ')}</p>
                    <p><strong>Acteurs :</strong> ${filmDetails.actors.join(', ')}</p>
                    <p><strong>Scénaristes :</strong> ${filmDetails.writers.join(', ')}</p>
                    <p><strong>Genres :</strong> ${filmDetails.genres.join(', ')}</p>
                    <p><a href="${filmDetails.imdb_url}" target="_blank">Voir sur IMDb</a></p>
                `;
            } else {
                filmDetailsContent.innerHTML = '<p>Aucun détail disponible pour ce film.</p>';
            }
        });
    }

    // Appliquer des styles en ligne à la modale
    const modalHeader = document.querySelector('#filmDetailsModal .modal-header');
    if (modalHeader) {
        modalHeader.style.backgroundColor = '#61787F';  // Fond noir
        modalHeader.style.color = 'white';  // Texte blanc
    }

    // Appliquer des styles en ligne à la modale
    const modalContent = document.querySelector('#filmDetailsModal .modal-content');
    if (modalContent) {
        modalContent.style.backgroundColor = ' rgb(27, 25, 25)';  // Fond noir
        modalContent.style.color = 'white';  // Texte blanc
    }

    // Afficher la modale Bootstrap
    const filmDetailsModal = new bootstrap.Modal(document.getElementById('filmDetailsModal'));
    filmDetailsModal.show();
}

// Fonction pour afficher les films les mieux notés (6 films)
function displayTopRatedFilms(films) {
    // Trier les films par note de manière décroissante (du mieux noté au moins bien noté)
    const topRatedFilms = films.sort((a, b) => b.imdb_score - a.imdb_score);

    // Sélectionner l'élément où les films seront affichés
    const ratedFilms = document.getElementById('ratedFilms');

    // Vider l'élément avant d'ajouter de nouveaux films
    ratedFilms.innerHTML = '';

    // Vérifier le type d'écran
    const isSmartphone = window.innerWidth <= 768; // Smartphone
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024; // Tablette

    // Créer le bouton "Voir plus" une seule fois
    const voirPlusButton = document.createElement('button');
    voirPlusButton.classList.add('btn', 'btn-danger', 'btn-block', 'mt-3');
    voirPlusButton.textContent = 'Voir plus';

    // Ajouter le bouton "Voir plus" au conteneur principal
    ratedFilms.appendChild(voirPlusButton);

    // Gestion des affichages selon le type d'écran
    if (isSmartphone) {
        // --- Affichage pour les smartphones ---
        const maxVisibleFilms = 1; // Nombre de films affichés à la fois
        let currentVisibleCount = 0;

        const renderFilms = () => {
            const filmsToDisplay = topRatedFilms.slice(currentVisibleCount, currentVisibleCount + maxVisibleFilms);

            filmsToDisplay.forEach(film => {
                const filmElement = createFilmElement(film);
                ratedFilms.insertBefore(filmElement, voirPlusButton); // Ajouter avant le bouton "Voir plus"
            });

            currentVisibleCount += maxVisibleFilms;

            if (currentVisibleCount >= topRatedFilms.length) {
                voirPlusButton.style.display = 'none';
            }

            ratedFilms.scrollTop = ratedFilms.scrollHeight; // Défiler vers le bas
        };

        renderFilms();
        voirPlusButton.addEventListener('click', renderFilms);

    } else if (isTablet) {
        // --- Affichage pour les tablettes ---
        const maxVisibleFilms = 4; // Nombre de films affichés à la fois

        for (let i = 0; i < maxVisibleFilms; i++) {
            if (topRatedFilms[i]) {
                const film = topRatedFilms[i];
                const filmElement = createFilmElement(film);
                ratedFilms.insertBefore(filmElement, voirPlusButton); // Ajouter avant le bouton "Voir plus"
            }
        }

        voirPlusButton.style.display = 'none';
        ratedFilms.scrollTop = ratedFilms.scrollHeight; // Défiler vers le bas

    } else {
        // --- Affichage pour les écrans larges ---
        const maxVisibleFilms = 6; // Limiter à 6 films maximum

        for (let i = 0; i < maxVisibleFilms; i++) {
            if (topRatedFilms[i]) {
                const film = topRatedFilms[i];
                const filmElement = createFilmElement(film);
                ratedFilms.insertBefore(filmElement, voirPlusButton); // Ajouter avant le bouton "Voir plus"
            }
        }

        voirPlusButton.style.display = 'none';
        ratedFilms.scrollTop = ratedFilms.scrollHeight; // Défiler vers le bas
    }

    // Gérer les boutons "Détails"
    ratedFilms.addEventListener('click', function (event) {
        if (event.target.classList.contains('detailsButton')) {
            const filmId = event.target.getAttribute('data-film-id');
            console.log('Film ID cliqué :', filmId);

            const film = topRatedFilms.find(f => f.id.toString() === filmId);

            if (film) {
                showFilmDetails(film);
            } else {
                console.error('Film introuvable avec l\'ID', filmId);
            }
        }
    });
}

// Fonction utilitaire pour créer un élément de film
function createFilmElement(film) {
    const filmElement = document.createElement('div');
    filmElement.classList.add('film-item', 'mb-3');
    const imageUrl = film.image_url || '/frontend/assets/images/default-image.jpg.png';

    filmElement.innerHTML = `
        <div class="film-image-container">
            <img src="${imageUrl}" class="d-block w-100" alt="${film.title}" onerror="this.src='/frontend/assets/images/default-image.jpg.png';">
            <div class="overlay">
                <h5>${film.title}</h5>
                <button data-film-id="${film.id}" class="btn btn-secondary btn-sm detailsButton">Détails</button>
            </div>
        </div>
    `;
    return filmElement;
}


function displayFilmsInCarousel(genre, films) {
    const container = document.getElementById(`${genre}Films`);
    if (!container) {
        console.error(`Le conteneur pour le genre ${genre} n'a pas été trouvé.`);
        return;
    }

    // Réinitialisation du conteneur
    container.innerHTML = '';

    if (!films || films.length === 0) {
        console.error(`Aucun film trouvé pour le genre ${genre}.`);
        return;
    }

    // Trier les films par leur score de manière décroissante
    films.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // Limiter à 18 films
    const topFilms = films.slice(0, 18);

    // Vérifier les dimensions de l'écran
    const isSmartphone = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

    if (isSmartphone) {
        // Mode smartphone : afficher 3 films à la fois
        const maxVisibleFilms = 3;
        let currentVisibleCount = 0;

        const voirPlusButton = document.createElement('button');
        voirPlusButton.classList.add('btn', 'btn-danger', 'btn-block', 'mt-3');
        voirPlusButton.textContent = 'Voir plus';
        container.appendChild(voirPlusButton);

        const renderFilms = () => {
            const fragment = document.createDocumentFragment();
            const filmsToDisplay = topFilms.slice(currentVisibleCount, currentVisibleCount + maxVisibleFilms);

            filmsToDisplay.forEach(film => {
                const filmElement = document.createElement('div');
                filmElement.classList.add('film-item', 'mb-3');
                const imageUrl = film.image_url || '/frontend/assets/images/default-image.jpg.png';

                filmElement.innerHTML = `
                    <div class="film-image-container">
                        <img src="${imageUrl}" class="img-fluid" alt="${film.title}" loading="lazy" onerror="this.src='/frontend/assets/images/default-image.jpg.png';">
                        <div class="overlay">
                            <h5>${film.title}</h5>
                            <button data-film-id="${film.id}" class="btn btn-secondary btn-sm detailsButton">
                                Détails
                            </button>
                        </div>
                    </div>
                `;
                fragment.appendChild(filmElement);
            });

            container.insertBefore(fragment, voirPlusButton);
            currentVisibleCount += maxVisibleFilms;

            if (currentVisibleCount >= topFilms.length) {
                voirPlusButton.style.display = 'none';
            }

            container.scrollTop = container.scrollHeight;
        };

        renderFilms();

        voirPlusButton.addEventListener('click', renderFilms);
    } else {
        // Mode tablette ou bureau : affichage en carrousel
        const filmsPerSlide = isTablet ? 4 : 6; // 4 films par slide pour les tablettes, 6 pour le bureau
        const numSlides = Math.ceil(topFilms.length / filmsPerSlide);
        const fragment = document.createDocumentFragment();

        for (let slideIndex = 0; slideIndex < numSlides; slideIndex++) {
            const slideFilms = topFilms.slice(slideIndex * filmsPerSlide, (slideIndex + 1) * filmsPerSlide);

            const slideElement = document.createElement('div');
            slideElement.classList.add('carousel-item');
            if (slideIndex === 0) {
                slideElement.classList.add('active');
            }

            const slideInnerContainer = document.createElement('div');
            slideInnerContainer.classList.add('row');

            slideFilms.forEach(film => {
                const imageUrls = film.image_url || '/frontend/assets/images/default-image.jpg.png';
                const filmElement = document.createElement('div');
                filmElement.classList.add(`col-${12 / filmsPerSlide}`); // Ajuster la largeur des colonnes dynamiquement

                filmElement.innerHTML = `
                    <div class="film-image-container">
                        <img src="${imageUrls}" class="d-block w-100" alt="${film.title}" loading="lazy" onerror="this.src='/frontend/assets/images/default-image.jpg.png';">
                        <div class="overlay">
                            <h5>${film.title}</h5>
                            <button data-film-id="${film.id}" class="btn btn-secondary btn-sm detailsButton">
                                Détails
                            </button>
                        </div>
                    </div>
                `;
                slideInnerContainer.appendChild(filmElement);
            });

            slideElement.appendChild(slideInnerContainer);
            fragment.appendChild(slideElement);
        }

        container.appendChild(fragment);
    }

    // Ajouter les événements pour les boutons "Détails"
    const detailButtons = container.querySelectorAll('.detailsButton');
    detailButtons.forEach(button => {
        button.addEventListener('click', function () {
            const filmId = button.getAttribute('data-film-id');
            const film = topFilms.find(f => String(f.id) === filmId);

            if (film) {
                showFilmDetails(film);
            } else {
                console.error('Film introuvable avec l\'ID', filmId);
            }
        });
    });
}

// Fonction pour initialiser le carrousel avec Bootstrap
// Assurez-vous que cette fonction est bien définie quelque part dans votre code
function initCarousel(genre) {
    const carouselElement = document.getElementById(`${genre}Films`);
    if (carouselElement) {
        new bootstrap.Carousel(carouselElement, {
            interval: 5000,  // Intervalle de 5 secondes entre les slides
            ride: 'carousel'
        });
    } else {
        console.error(`Carrousel pour le genre ${genre} introuvable.`);
    }
}
// Fonction pour capitaliser la première lettre du genre
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Appel de la fonction pour récupérer les films pour chaque genre
genresToDisplay.forEach(genre => {
    fetchFilmsByGenre(genre);  // Récupérer les films pour chaque genre
});

// Appeler la fonction pour récupérer les films généraux (si nécessaire)
fetchData();



























