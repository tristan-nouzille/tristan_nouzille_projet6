const apiUrlFilms = 'http://localhost:8000/api/v1/titles/';  // L'URL de l'API pour les films
const apiUrlFilmsByGenre = 'http://localhost:8000/api/v1/titles/?genre=';  // URL pour récupérer les films par genre

// Liste des genres à afficher dans le carrousel
const genresToDisplay = ['biography', 'horror'];

// Fonction pour récupérer les films par genre avec gestion de la pagination
async function fetchFilmsByGenre(genre) {
    const apiUrl = `${apiUrlFilmsByGenre}${genre}`;
    let allFilms = [];
    let nextPageUrl = apiUrl;

    try {
        while (nextPageUrl && allFilms.length < 18) {
            const response = await fetch(nextPageUrl);
            
            // Vérification de la réponse de l'API
            if (!response.ok) {
                throw new Error(`Erreur de récupération des films pour "${genre}", code: ${response.status}`);
            }

            const data = await response.json();

            // Vérification si les résultats sont bien présents dans la réponse
            if (!data.results) {
                throw new Error(`Pas de films trouvés pour "${genre}" dans la réponse de l'API.`);
            }

            console.log("Données API pour le genre:", genre, data); // Pour débogage

            const films = Array.isArray(data.results) ? data.results : [];
            allFilms = allFilms.concat(films);

            // Affichage des films avec leur description
            films.forEach(film => {
                console.log(`Film: ${film.title}, Description: ${film.description || 'Aucune description disponible.'}`);
            });

            // Mise à jour de l'URL pour la page suivante
            nextPageUrl = data.next;

            // Limiter le nombre de films récupérés à 18
            if (allFilms.length >= 18) {
                allFilms = allFilms.slice(0, 18); // Couper les films excédentaires
                break;
            }
        }

        // Afficher les films dans le carrousel (ou autre méthode d'affichage)
        displayFilmsInCarousel(genre, allFilms);
    } catch (error) {
        console.error(`Erreur dans la récupération des films pour le genre "${genre}" :`, error);
        // Retourner un tableau vide en cas d'erreur
        return [];
    }
}

// Liste des genres affichés dans le menu
async function fetchCategories() {
    const apiUrl = 'http://localhost:8000/api/v1/genres/';
    let allCategories = [];
    let nextPageUrl = apiUrl;

    try {
        while (nextPageUrl) {
            const response = await fetch(nextPageUrl);
            if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

            const data = await response.json();
            allCategories = allCategories.concat(data.results);
            nextPageUrl = data.next;
        }

        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = ''; // Vider la liste avant de rajouter les catégories

        // Parcourir toutes les catégories
        allCategories.forEach(genre => {
            // Créer un élément de liste pour chaque genre
            const p = document.createElement('p');
            p.textContent = genre.name;
            p.classList.add('category-item');

            // Ajouter un événement de clic pour chaque catégorie
            p.addEventListener('click', () => {
                // Créer dynamiquement la section pour le genre sélectionné
                createGenreSection(genre);
                fetchFilmsByGenre(genre.name); // Charger les films associés à ce genre
            });

            // Ajouter la catégorie à la liste
            categoriesList.appendChild(p);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories :', error);
    }
}

// Fonction pour créer la section avec le titre et le conteneur de films pour un genre sélectionné
function createGenreSection(genre) {
    // Vérifier si la section pour ce genre existe déjà
    const existingSection = document.getElementById(`${genre.name}Section`);
    if (existingSection) return; // Si la section existe déjà, ne rien faire

    // Créer la section entière
    const section = document.createElement('section');
    section.classList.add('categorie');
    section.id = `${genre.name}Section`; // ID unique pour chaque genre

    // Créer le titre pour le genre
    const title = document.createElement('h2');
    title.textContent = genre.name;
    section.appendChild(title);

    // Créer le conteneur pour les films de ce genre
    const filmsContainer = document.createElement('div');
    filmsContainer.id = `${genre.name}Films`; // ID unique pour chaque genre
    filmsContainer.classList.add('film-image-container');
    section.appendChild(filmsContainer);

    // Ajouter la section à la page (dans la balise main)
    const mainContainer = document.querySelector('main');
    mainContainer.appendChild(section);
}

document.addEventListener('DOMContentLoaded', fetchCategories);  // Lancer la récupération des genres lorsque le DOM est chargé

async function handleCategorySelection(genre) {
    console.log('Genre sélectionné:', genre);

    const films = await fetchData(genre);

    if (films && films.length > 0) {
        displayFilmsInCarousel(films, genre);
    } else {
        console.log(`Aucun film trouvé pour le genre "${genre}".`);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.querySelector("main");

    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
        mainContent.style.marginLeft = "0";
    } else {
        sidebar.style.width = "250px";
        mainContent.style.marginLeft = "250px";
    }

    fetchCategories();
}

document.addEventListener("DOMContentLoaded", () => {
    // Maintenant le DOM est prêt à être manipulé.
    fetchCategories();
    document.getElementById("menuButton").addEventListener("click", toggleSidebar);
});

// Fonction pour récupérer tous les films (avec pagination)
async function fetchData() {
    try {
        let allFilms = [];  // Tableau pour stocker tous les films récupérés
        let nextPageUrl = apiUrlFilms;  // Commencer avec l'URL de la première page

        // Continue de récupérer les pages tant qu'il y a une URL "next" ou que le nombre de films est insuffisant
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
            if (allFilms.length >= 18) {
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

async function fetchFilmDetails(filmId) {
    const filmUrl = `http://localhost:8000/api/v1/titles/${filmId}`;
    try {
        const response = await fetch(filmUrl);
        if (!response.ok) throw new Error('Erreur de récupération des détails du film');
        const filmDetails = await response.json();
        return filmDetails;  // Retourne les détails du film
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

function showFilmDetails(film) {
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

    // Vérifier si l'écran est un smartphone (largeur maximale de 768px)
    const isSmartphone = window.innerWidth <= 768;

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

        // Fonction pour afficher les films un par un
        const renderFilms = () => {
            const filmsToDisplay = topRatedFilms.slice(currentVisibleCount, currentVisibleCount + maxVisibleFilms);

            // Ajouter les films sélectionnés au DOM
            filmsToDisplay.forEach(film => {
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
                ratedFilms.insertBefore(filmElement, voirPlusButton); // Ajouter avant le bouton "Voir plus"
            });

            currentVisibleCount += maxVisibleFilms;

            // Masquer le bouton "Voir plus" si tous les films sont affichés
            if (currentVisibleCount >= topRatedFilms.length) {
                voirPlusButton.style.display = 'none';
            }

            // --- Défilement vers le bas ---
            ratedFilms.scrollTop = ratedFilms.scrollHeight; // Défile vers le bas du conteneur
        };

        // Initialiser l'affichage
        renderFilms();

        // Ajouter un événement au bouton "Voir plus"
        voirPlusButton.addEventListener('click', renderFilms);

    } else {
        // --- Affichage pour les écrans larges ---
        const maxVisibleFilms = 6; // Limiter à 6 films maximum

        for (let i = 0; i < maxVisibleFilms; i++) {
            if (topRatedFilms[i]) { // Vérifier si le film existe
                const film = topRatedFilms[i];
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
                ratedFilms.insertBefore(filmElement, voirPlusButton); // Ajouter avant le bouton "Voir plus"
            }
        }

        // Masquer le bouton pour les écrans larges (si tous les films sont déjà affichés)
        voirPlusButton.style.display = 'none';

        // --- Défilement vers le bas ---
        ratedFilms.scrollTop = ratedFilms.scrollHeight; // Défiler vers le bas pour 6 films affichés
    }

    // Gérer les boutons "Détails" (valable pour les deux cas)
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

    // Créer le bouton "Voir plus" et ajouter les classes Bootstrap
    const voirPlusButton = document.createElement('button');
    voirPlusButton.classList.add('btn', 'btn-danger', 'btn-block', 'mt-3');
    voirPlusButton.textContent = 'Voir plus';
    container.appendChild(voirPlusButton); // Ajouter le bouton après les films

    // Appliquer un style pour s'assurer que le bouton reste en bas
    container.style.position = 'relative';

       // Vérifier la largeur de l'écran pour déterminer le nombre d'images par slide
    const isSmartphone = window.innerWidth <= 768; // Smartphone
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024; // Tablette
    const filmsPerSlide = isSmartphone ? 3 : isTablet ? 4 : 6; // 3 pour smartphone, 4 pour tablette, 6 pour bureau

    if (isSmartphone) {

        const carouselIcons = document.querySelectorAll(
            `.carousel-control-prev, .carousel-control-next, .carousel-indicators`
        );
        carouselIcons.forEach(icon => icon.remove());
        const maxVisibleFilms = 3; // Nombre maximum de films visibles à la fois
        let currentVisibleCount = 0;

        // Fonction pour afficher les films
        const renderFilms = () => {
            const fragment = document.createDocumentFragment();
            const filmsToDisplay = films.slice(currentVisibleCount, currentVisibleCount + maxVisibleFilms);

            filmsToDisplay.forEach(film => {
                const filmElement = document.createElement('div');
                filmElement.classList.add('film-item', 'mb-3');
                const imageUrl = film.image_url || '/frontend/assets/images/default-image.jpg.png';

                filmElement.innerHTML = `
                    <div class="film-image-container">
                        <img src="${imageUrl}" class="img-fluid" alt="${film.title}" loading="lazy" onerror="this.src='/frontend/assets/images/default-image.jpg.png';">
                        <div class="overlay">
                            <h5>${film.title}</h5>
                            <button data-film-id="${film.id}" class="btn btn-secondary btn-sm detailsButton" aria-label="Voir les détails du film ${film.title}">
                                Détails
                            </button>
                        </div>
                    </div>
                `;
                fragment.appendChild(filmElement);
            });

            // Ajouter les films affichés au conteneur
            container.insertBefore(fragment, voirPlusButton); // Ajouter les films avant le bouton "Voir plus"
            currentVisibleCount += filmsToDisplay.length;

            // Gérer l'affichage du bouton "Voir plus"
            if (currentVisibleCount >= films.length) {
                voirPlusButton.style.display = 'none'; // Masquer le bouton quand tous les films sont affichés
            }

            // Faire défiler vers le bas si des films ont été ajoutés
            container.scrollTop = container.scrollHeight;
        };

        // Ajouter un événement au bouton "Voir plus"
        voirPlusButton.addEventListener('click', function () {
            renderFilms();
        });

        // Afficher les premiers films au départ
        renderFilms();

    } else {
        // Mode bureau : affichage en carrousel
        const filmsPerSlide = 6; // Nombre de films par slide
        const numSlides = Math.ceil(films.length / filmsPerSlide);
        const fragment = document.createDocumentFragment();

        for (let slideIndex = 0; slideIndex < numSlides; slideIndex++) {
            const slideFilms = films.slice(slideIndex * filmsPerSlide, (slideIndex + 1) * filmsPerSlide);

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
                filmElement.classList.add('col-md-2');

                filmElement.innerHTML = `
                    <div class="film-image-container">
                        <img src="${imageUrls}" class="d-block w-100" alt="${film.title}" loading="lazy" onerror="this.src='/frontend/assets/images/default-image.jpg.png';">
                        <div class="overlay">
                            <h5>${film.title}</h5>
                            <button data-film-id="${film.id}" class="btn btn-secondary btn-sm detailsButton" aria-label="Voir les détails du film ${film.title}">
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
            const film = films.find(f => String(f.id) === filmId);

            if (film) {
                showFilmDetails(film);
            } else {
                console.error('Film introuvable avec l\'ID', filmId);
            }
        });
    });

    const carouselItems = document.getElementById('carouselItems');
    const filmCarousel = document.getElementById('filmCarousel');
    carouselItems.innerHTML = ''; // Vider le carrousel avant de rajouter les films

    filmCarousel.style.display = 'block'; // Afficher le carrousel

    films.forEach((film, index) => {
        const isActive = index === 0 ? 'active' : ''; // Le premier film sera actif
        const filmItem = document.createElement('div');
        filmItem.classList.add('carousel-item', isActive);

        // Ajouter une image de film et le titre
        filmItem.innerHTML = `
            <div class="film-image-container">
                <img src="${film.image_url || '/path/to/default-image.jpg'}" class="d-block w-100" alt="${film.title}">
                <div class="carousel-caption d-none d-md-block">
                    <h5>${film.title}</h5>
                </div>
            </div>
        `;

        carouselItems.appendChild(filmItem);
    });

    initCarousel(genre);
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



























