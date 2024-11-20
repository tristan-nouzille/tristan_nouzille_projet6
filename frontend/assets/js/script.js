const apiUrlFilms = 'http://localhost:8000/api/v1/titles/';  // L'URL de l'API pour les films
const apiUrlFilmsByGenre = 'http://localhost:8000/api/v1/titles/?genre=';  // URL pour récupérer les films par genre

// Liste des genres à afficher dans le carrousel
const genresToDisplay = ['biography', 'horror'];

// Fonction pour récupérer les films par genre avec gestion de la pagination
async function fetchFilmsByGenre(genre) {
    const apiUrl = `${apiUrlFilmsByGenre}${genre.toLowerCase()}`;
    let allFilms = [];
    let nextPageUrl = apiUrl;

    try {
        while (nextPageUrl && allFilms.length < 18) {
            const response = await fetch(nextPageUrl);
            if (!response.ok) throw new Error(`Erreur de récupération des films pour "${genre}"`);

            const data = await response.json();
            console.log("Données API pour le genre:", genre, data); // Vérifiez la réponse API ici

            const films = Array.isArray(data.results) ? data.results : [];
            allFilms = allFilms.concat(films);

            // Vérifiez chaque film pour voir s'il a bien une description
            films.forEach(film => {
                console.log(`Film: ${film.title}, Description: ${film.description || 'Aucune description disponible.'}`);
            });

            nextPageUrl = data.next;
        }

        // Afficher les films dans le carrousel
        displayFilmsInCarousel(genre, allFilms.slice(0, 18));

    } catch (error) {
        console.error(`Erreur dans la récupération des films pour le genre "${genre}" :`, error);
    }
}



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

        topFilmContent.innerHTML = `
            <div class="cadre container">
                <div>
                    <h2>${film.title} (${film.year})</h2>
                    <div class="toPimage">
                        <img src="${film.image_url}" class="topImg" alt="${film.title}">
                    </div>
                </div>
                <div class="text-col-p">
                    <p><strong>Description :</strong> ${descriptionToDisplay}</p>
                </div>
                <div>
                    <button id="detailsButton${film.id}" class="btn-danger">Détails</button>
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

                filmDetailsContent.innerHTML = `
                    <h4>${filmDetails.title} (${filmDetails.year})</h4>
                    <img src="${filmDetails.image_url}" class="img-fluid" alt="${filmDetails.title}">
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




// Fonction pour afficher les films les mieux notés (top 6)
function displayTopRatedFilms(films) {
    // Trier les films par note de manière décroissante (du mieux noté au moins bien noté)
    const topRatedFilms = films.sort((a, b) => b.imdb_score - a.imdb_score);

    // Sélectionner l'élément où les films seront affichés
    const ratedFilms = document.getElementById('ratedFilms');

    // Vider l'élément avant d'ajouter de nouveaux films
    ratedFilms.innerHTML = '';

    // Afficher les 6 premiers films dans l'élément
    for (let i = 0; i < 6; i++) {
        if (topRatedFilms[i]) { // Vérifie que l'index existe
            const film = topRatedFilms[i];
            const filmElement = document.createElement('div');
            filmElement.classList.add('film-item'); // Classe pour chaque film

            // Structure HTML pour chaque film, y compris l'image
            filmElement.innerHTML = `
                <img src="${film.image_url}" alt="${film.title}">
            `;

            ratedFilms.appendChild(filmElement);
        }
    }
}


function displayFilmsInCarousel(genre, films) {
    const container = document.getElementById(`${genre}Films`);  // Conteneur du carrousel pour chaque genre
    container.innerHTML = '';  // Vider le conteneur avant d'ajouter de nouveaux films

    // Vérifier si la liste de films est vide
    if (!films || films.length === 0) {
        console.error(`Aucun film trouvé pour le genre ${genre}.`);
        return;
    }

    // Découper les films en groupes de 6 films par slide
    const filmsPerSlide = 6;
    const numSlides = Math.ceil(films.length / filmsPerSlide);  // Nombre de slides nécessaires

    // Créer les slides
    for (let slideIndex = 0; slideIndex < numSlides; slideIndex++) {
        const slideFilms = films.slice(slideIndex * filmsPerSlide, (slideIndex + 1) * filmsPerSlide);  // Films pour cette slide

        // Créer l'élément pour la slide
        const slideElement = document.createElement('div');
        slideElement.classList.add('carousel-item');

        // Ajouter la classe 'active' à la première slide
        if (slideIndex === 0) {
            slideElement.classList.add('active');
        }

        // Créer une ligne de films pour cette slide
        const slideInnerContainer = document.createElement('div');
        slideInnerContainer.classList.add('row');

        slideFilms.forEach(film => {
            // Vérification des films et de leur ID
            console.log(`Film dans le carrousel : ${film.title}, ID : ${film.id}`);

            const filmElement = document.createElement('div');
            filmElement.classList.add('col-md-2');  // Class pour chaque image de film

            // Créer le conteneur d'image avec overlay
            filmElement.innerHTML = `
                <div class="film-image-container">
                    <img src="${film.image_url}" class="d-block w-100" alt="${film.title}">
                    <div class="overlay">
                        <h5>${film.title}</h5>
                        <button data-film-id="${film.id}" class="btn btn-secondary btn-sm detailsButton">Détails</button>
                    </div>
                </div>
            `;

            slideInnerContainer.appendChild(filmElement);
        });

        // Ajouter la ligne de films à la slide
        slideElement.appendChild(slideInnerContainer);
        container.appendChild(slideElement);
    }

    // Attacher l'eventListener au bouton "Détails" après que tous les films aient été ajoutés au DOM
    const detailButtons = container.querySelectorAll('.detailsButton');
    detailButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Récupérer l'ID du film depuis l'attribut 'data-film-id'
            const filmId = button.getAttribute('data-film-id');
            console.log('Film ID cliqué :', filmId); // Vérifiez l'ID récupéré dans la console

            // Trouver le film correspondant à cet ID
            const film = films.find(f => f.id.toString() === filmId);  // Assurez-vous que la comparaison est correcte

            if (film) {
                // Si le film existe, afficher les détails
                showFilmDetails(film);
            } else {
                // Si le film est introuvable
                console.error('Film introuvable avec l\'ID', filmId);
            }
        });
    });

    // Initialiser le carrousel si nécessaire
    initCarousel(genre);
}


// Fonction pour initialiser le carrousel avec Bootstrap
function initCarousel(genre) {
    // Initialiser le carrousel pour chaque genre
    const carouselElement = document.getElementById(`carouselExampleControls${capitalizeFirstLetter(genre)}`);
    if (carouselElement) {
        const bootstrapCarousel = new bootstrap.Carousel(carouselElement, {
            interval: 3000,  // Intervalle entre les slides
            ride: 'carousel'  // Démarre le carrousel automatiquement
        });
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











