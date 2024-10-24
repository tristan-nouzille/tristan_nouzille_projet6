// Fichier: script.js

document.addEventListener("DOMContentLoaded", () => {
    // URLs de l'API
    const baseApiUrl = "http://localhost:8000/api/v1/titles/";
    
    // Récupère et affiche les informations du meilleur film
    fetchFilm(`${baseApiUrl}9008642`, displayTopFilm);

    // Récupère et affiche les films les mieux notés
    fetchFilms(`${baseApiUrl}?sort_by=-imdb_score&page_size=5`, displayBestRatedFilms);

    // Récupère et affiche les films d'une catégorie (ex: Action)
    fetchFilms(`${baseApiUrl}?genre_contains=Action&page_size=6`, displayCategoryFilms, 'Action');

    // Récupère et affiche les films d'une autre catégorie (ex: Horreur)
    fetchFilms(`${baseApiUrl}?genre_contains=Horror&page_size=6`, displayCategoryFilms, 'Horreur');
});

// Fonction pour récupérer un film spécifique
function fetchFilm(url, callback) {
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error("Erreur lors de la récupération du film:", error));
}

// Fonction pour récupérer plusieurs films
function fetchFilms(url, callback, category = null) {
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data.results, category))
        .catch(error => console.error("Erreur lors de la récupération des films:", error));
}

// Affiche les détails du meilleur film
function displayTopFilm(film) {
    const topFilmImg = document.querySelector(".topImg");
    const topFilmTitle = document.querySelector(".text-col .ligne h2");
    const topFilmDesc = document.querySelector(".text-col .ligne p");
    const topFilmLink = document.querySelector(".text-col .ligne a");

    topFilmImg.src = film.image_url;
    topFilmTitle.textContent = film.title;
    topFilmDesc.textContent = film.description;
    topFilmLink.href = film.url;
}

// Affiche les films dans la section des mieux notés
function displayBestRatedFilms(films) {
    const container = document.querySelector(".container");
    container.innerHTML = ""; // Efface les anciens films avant d'ajouter les nouveaux

    films.forEach(film => {
        const filmDiv = document.createElement("div");
        filmDiv.classList.add("film");
        filmDiv.innerHTML = `
            <a itemprop="url" href="${film.url}">
                <button type="button" class="btn btn-secondary">Détails</button>
                <img src="${film.image_url}" alt="${film.title}">
            </a>
        `;
        container.appendChild(filmDiv);
    });
}

// Affiche les films d'une catégorie (Action ou Horreur)
function displayCategoryFilms(films, category) {
    const categoryContainer = document.querySelector(`h3.categorie:contains(${category})`).nextElementSibling;

    films.forEach(film => {
        const filmDiv = document.createElement("div");
        filmDiv.classList.add("film");
        filmDiv.innerHTML = `
            <a itemprop="url" href="${film.url}">
                <button type="button" class="btn btn-secondary">Détails</button>
                <img src="${film.image_url}" alt="${film.title}">
            </a>
        `;
        categoryContainer.appendChild(filmDiv);
    });
}