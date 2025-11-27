import { getPopularMovies, getMovieById, searchMovies, getMoviesByGenre, getMoviesByYear, getSimilarMovies  } from "./services/movie.services.js";
import { renderMovieList, renderKPIs, renderMovieDetail, updateSectionTitle, hideKPIs, showKPIs, renderSimilarMoviesTable} from "./models/movie.models.js";
import { calculateTotalMovies, calculateAverageScore} from "./data/movie.data.js";


document.addEventListener("DOMContentLoaded", async () => {
    const path = window.location.pathname;

    if (path.endsWith("index.html") || path.endsWith("/")) {
        // Página principal > películas populares
        const movies = await getPopularMovies();
        renderKPIs(calculateTotalMovies(movies), calculateAverageScore(movies), movies);
        renderMovieList(movies);

    } else if (path.endsWith("movie.html")) {
        // Página detalle de película
        const params = new URLSearchParams(window.location.search);
        const movieId = params.get("id");

        if (movieId) {
            const movie = await getMovieById(movieId);
            renderMovieDetail(movie);

            // Selector de tabla
            const selector = document.getElementById("movieTableType");
            if (selector) {
                selector.innerHTML = `
                    <option value="genre">Películas del mismo género (${movie.genres.map(g => g.name).join(", ")})</option>
                    <option value="year">Películas del mismo año (${movie.year || "-"})</option>
                `;

                selector.addEventListener("change", (e) => {
                    renderTableByType(e.target.value);
                });

                // Render inicial
                renderTableByType(selector.value || "genre");
            }

            // Tabla de similares (por popularidad)
            const similar = await getSimilarMovies(movieId);
            renderSimilarMoviesTable(similar);

        } else {
            document.getElementById("movie-detail").innerHTML = "<p>Película no encontrada.</p>";
        }
    }

    // Búsqueda con paginación
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", async (e) => {
            const term = e.target.value.trim();
            currentSearchTerm = term;
            currentPage = 1;

            if (term.length > 2) {
                hideKPIs();
                loadSearchPage();
            } else {
                showKPIs();
                const movies = await getPopularMovies();
                renderKPIs(calculateTotalMovies(movies), calculateAverageScore(movies), movies);
                renderMovieList(movies);
                updateSectionTitle("Películas populares");
                document.getElementById("pagination").innerHTML = "";
            }
        });
    }
});


function getCurrentMovieId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function renderTableByType(type = "genre") {
    const movieId = getCurrentMovieId();
    if (!movieId) return;

    let movies = [];
    let title = "";

    if (type === "genre") {
        movies = await getMoviesByGenre(movieId);
    } else if (type === "year") {
        movies = await getMoviesByYear(movieId);
    }

    renderSimilarMoviesTable(movies, { title });
}


// =======================
// Búsqueda con paginación
// =======================

let currentSearchTerm = "";
let currentPage = 1;
let totalPages = 1;

async function loadSearchPage() {
    hideKPIs();
    const { results, totalPages: tp, currentPage: cp } = await searchMovies(currentSearchTerm, currentPage);

    totalPages = tp;
    currentPage = cp;
    renderMovieList(results);
    updateSectionTitle(`Resultados de búsqueda: "${currentSearchTerm}" (página ${currentPage} de ${totalPages})`);
    renderPagination();
}

function renderPagination() {
    const container = document.getElementById("pagination");

    if (!currentSearchTerm || totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <button id="prevPage" ${currentPage === 1 ? "disabled" : ""}>Anterior</button>
        <button id="nextPage" ${currentPage === totalPages ? "disabled" : ""}>Siguiente</button>
    `;

    document.getElementById("prevPage").onclick = () => {
        currentPage--;
        loadSearchPage();
    };

    document.getElementById("nextPage").onclick = () => {
        currentPage++;
        loadSearchPage();
    };}