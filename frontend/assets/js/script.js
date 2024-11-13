const apiUrl = 'http://localhost:8000/api/v1/titles/'; // L'URL de l'API

// Fonction pour récupérer les films depuis l'API
async function fetchData() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Erreur réseau');
        
        // Récupérer les données JSON
        const data = await response.json();
        
        // Vérifiez ce que vous obtenez depuis l'API
        console.log("Données brutes de l'API : ", data);
        
        // Vérifiez si "data.results" est un tableau et contient bien des films
        const films = Array.isArray(data.results) ? data.results : [];
        console.log("Films récupérés : ", films); // Affiche les films récupérés
        
        // Affichage du film le mieux noté
        const topFilm = findTopFilm(films);
        displayTopFilm(topFilm);

        // Affichage des 6 films les mieux notés
        displayTopRatedFilms(films);
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
    for (let i = 0; i < 7; i++) {
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


// Appeler la fonction pour récupérer les données et afficher les films
fetchData();







