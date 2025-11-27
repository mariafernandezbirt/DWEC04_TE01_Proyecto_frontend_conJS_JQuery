const API_KEY = "3a3e519e2ba00c3f174ff2bffa717ff6";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

export function getPopularMovies() {
    const url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES`;

    return fetch(url)
        .then(res => {
            if (!res.ok) throw new Error("Error al obtener películas");
            return res.json();
        })
        .then(data => data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            description: movie.overview,
            releaseDate: movie.release_date,
            year: movie.release_date ? movie.release_date.split("-")[0] : null,
            rating: movie.vote_average,
            image: IMG_URL + movie.poster_path
        })))
        .catch(err => {
            console.error(err);
            return [];
        });
}

export function getMovieById(id) {
    const url = `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=es-ES`;
    
    return fetch(url)
        .then(res => {
            if (!res.ok) throw new Error("Error al obtener película");
            return res.json();
        })
        .then(movie => {
            const year = movie.release_date ? movie.release_date.split("-")[0] : null;

            return {
                id: movie.id,
                title: movie.title,
                description: movie.overview,
                releaseDate: movie.release_date,
                year, // solo el año
                rating: movie.vote_average,
                image: movie.poster_path ? IMG_URL + movie.poster_path : "",
                genres: movie.genres || [],
            };
        })

        .catch(err => {
            console.error(err);
            return {};
        });
}

export async function searchMovies(query, page = 1) {
    const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&include_adult=false&page=${page}`;

    const response = await fetch(url);
    const data = await response.json();

    // 🔹 Filtrar películas con datos
    let results = data.results.filter(movie =>
        movie.poster_path &&
        movie.overview &&
        movie.overview.trim() !== ""
    ).map(movie => ({
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        releaseDate: movie.release_date,
        year: movie.release_date ? movie.release_date.split("-")[0] : null,
        rating: movie.vote_average,
        image: IMG_URL + movie.poster_path
    }));

    // Si hay menos de 20, rellenar con la siguiente página
    let nextPage = page + 1;
    while (results.length < 20 && nextPage <= data.total_pages) {
        const nextUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&include_adult=false&page=${nextPage}`;
        const nextResponse = await fetch(nextUrl);
        const nextData = await nextResponse.json();

        const extra = nextData.results.filter(movie =>
            movie.poster_path &&
            movie.overview &&
            movie.overview.trim() !== ""
        ).map(movie => ({
            id: movie.id,
            title: movie.title,
            description: movie.overview,
            releaseDate: movie.release_date,
            year: movie.release_date ? movie.release_date.split("-")[0] : null,
            rating: movie.vote_average,
            image: IMG_URL + movie.poster_path
        }));

        results = results.concat(extra);
        nextPage++;
    }

    // Limite 20 resultados
    results = results.slice(0, 20);

    return {
        results,
        totalPages: data.total_pages,
        currentPage: page
    };
}



export function getSimilarMovies(id) {
    const url = `${BASE_URL}/movie/${id}/similar?api_key=${API_KEY}&language=es-ES`;

    return fetch(url)
        .then(res => res.json())
        .then(data => data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            releaseDate: movie.release_date,
            year: movie.release_date ? movie.release_date.split("-")[0] : null,
            rating: movie.vote_average,
            image: movie.poster_path ? IMG_URL + movie.poster_path : ""
        })))
        .catch(err => {
            console.error("Error obteniendo similares:", err);
            return [];
        });
}

export async function searchAllMovies(query) {
    const firstUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&include_adult=false&page=1`;

    const firstResponse = await fetch(firstUrl).then(r => r.json());

    const totalPages = firstResponse.total_pages;
    let allResults = [...firstResponse.results];

    // Máximo de resultados: 500 paginas > 10.000 peliculas)
    const maxPages = Math.min(totalPages, 500);

    for (let page = 2; page <= maxPages; page++) {
        const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&include_adult=false&page=${page}`;
        const response = await fetch(url).then(r => r.json());
        allResults = allResults.concat(response.results);
    }

    return allResults.map(movie => ({
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        releaseDate: movie.release_date,
        year: movie.release_date ? movie.release_date.split("-")[0] : null,
        rating: movie.vote_average,
        image: movie.poster_path ? IMG_URL + movie.poster_path : ""
    }));
}

export async function searchMoviesProgressive(query, onBatch) {
    const firstUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&include_adult=false&page=1`;

    const firstResponse = await fetch(firstUrl).then(r => r.json());

    const totalPages = firstResponse.total_pages;
    const maxPages = Math.min(totalPages, 50);

    // Procesar primera página
    let batch = firstResponse.results.map(movie => ({
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        releaseDate: movie.release_date,
        year: movie.release_date ? movie.release_date.split("-")[0] : null,    
        rating: movie.vote_average,
        image: movie.poster_path ? IMG_URL + movie.poster_path : ""
    }));

    onBatch(batch); // enviamos el primer lote

    // Cargar el resto en segundo plano
    for (let page = 2; page <= maxPages; page++) {
        const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&include_adult=false&page=${page}`;
        const response = await fetch(url).then(r => r.json());

        batch = response.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            description: movie.overview,
            releaseDate: movie.release_date,
            year: movie.release_date ? movie.release_date.split("-")[0] : null,
            rating: movie.vote_average,
            image: movie.poster_path ? IMG_URL + movie.poster_path : ""
        }));

        onBatch(batch); // enviamos cada lote según llega
    }
}

export async function getMoviesByGenre(movieId) {
    // 1. Obtener detalles de la película actual
    const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-ES`;
    const data = await fetch(url).then(r => r.json());

    // 2. Tomar el primer género
    const genreId = data.genres?.[0]?.id;
    if (!genreId) return [];

    // 3. Buscar películas por ese género
    const genreUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&with_genres=${genreId}&sort_by=popularity.desc`;
    const genreData = await fetch(genreUrl).then(r => r.json());

    // 4. Mapear resultados filtrando las que tengan imagen y overview
    return genreData.results
        .filter(m => m.poster_path && m.overview && m.overview.trim() !== "")
        .map(m => ({
            id: m.id,
            title: m.title,
            description: m.overview,
            releaseDate: m.release_date,
            year: m.release_date ? m.release_date.split("-")[0] : null,
            rating: m.vote_average,
            image: IMG_URL + m.poster_path
        }));

}


export async function getMoviesByDirector(movieId) {
    const url = `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=es-ES`;
    const data = await fetch(url).then(r => r.json());

    const director = data.crew.find(c => c.job === "Director");
    if (!director) return [];

    const directorUrl = `${BASE_URL}/search/person?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(director.name)}`;
    const directorData = await fetch(directorUrl).then(r => r.json());

    // coger sus películas conocidas
    const movies = directorData.results[0]?.known_for || [];
    return movies.map(m => ({
        id: m.id,
        title: m.title || m.name,
        description: m.overview,
        releaseDate: m.release_date,
        year: movie.release_date ? movie.release_date.split("-")[0] : null,
        rating: m.vote_average,
        image: m.poster_path ? IMG_URL + m.poster_path : ""
    }));
}

export async function getMoviesByYear(movieId) {
    const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-ES`;
    const data = await fetch(url).then(r => r.json());

    const year = data.release_date?.split("-")[0];
    if (!year) return [];

    const yearUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&primary_release_year=${year}&sort_by=popularity.desc`;
    const yearData = await fetch(yearUrl).then(r => r.json());

    return yearData.results
        .filter(m => m.poster_path && m.overview && m.overview.trim() !== "")
        .map(m => ({
            id: m.id,
            title: m.title,
            description: m.overview,
            releaseDate: m.release_date,
            year: m.release_date ? m.release_date.split("-")[0] : null,
            rating: m.vote_average,
            image: m.poster_path ? IMG_URL + m.poster_path : ""
        }));
}

