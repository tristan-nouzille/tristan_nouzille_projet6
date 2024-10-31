const apiUrl = 'http://localhost:8000/api/v1/titles/'; // L'URL de l'API

async function fetchData() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        const topFilm = findTopFilm(data.results);
        displayTopFilm(topFilm);
    } catch (error) {
        console.error('Erreur :', error);
    }
}

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

function displayTopFilm(film) {
    const topFilmContent = document.getElementById('topFilmContent');
    if (film) {
        topFilmContent.innerHTML = `
            <h2>${film.title} (${film.year})</h2>
            <p><strong>Note IMDB :</strong> ${film.imdb_score}</p>
            <p><strong>Votes :</strong> ${film.votes}</p>
            <img src="${film.image_url}" alt="${film.title}">
        `;
    } else {
        topFilmContent.innerHTML = '<p>Aucun film trouvé.</p>';
    }
}

fetchData();


