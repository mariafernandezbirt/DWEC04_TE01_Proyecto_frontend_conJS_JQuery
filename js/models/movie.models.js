export function renderMovieList(movies) {
    const container = document.getElementById("movies-grid");
    if (!container) return;

    container.innerHTML = "";

    movies.forEach(movie => {
        const card = document.createElement("div");
        card.classList.add("movie-card");

        card.innerHTML = `
            <img class="poster" src="${movie.image || 'https://placehold.co/300x450?text=Sin+imagen'}" alt="${movie.title}">
            <div class="card-body">
                <h3 class="title">${movie.title}</h3>
                <div class="meta">
                    <span> ${typeof movie.rating === "number" ? movie.rating.toFixed(1) : "-"}</span>
                    <span> ${movie.releaseDate || "-"}</span>
                </div>
                <p class="overview">${movie.description || ""}</p>
            </div>
        `;

        card.addEventListener("click", () => {
            window.location.href = `views/movie.html?id=${movie.id}`;
        });

        container.appendChild(card);
    });
}

import { calculateMostPopular } from "../data/movie.data.js";


export function renderKPIs(total, avg, movies) {
    document.getElementById("total-movies").textContent = total;
    const avgEl = document.getElementById("avg-vote");
    if (avgEl) avgEl.textContent = avg.toFixed(1);

    const popularEl = document.getElementById("most-popular");
    if (popularEl) {
        const mostPopular = calculateMostPopular(movies);
        popularEl.textContent = mostPopular || "—";
    }
}


export function renderMovieDetail(movie) {
    const container = document.getElementById("movie-detail");
    if (!container) return;

    const year = movie.releaseDate ? movie.releaseDate.split("-")[0] : "-";
    const director = movie.director || "Desconocido";
    const genres = movie.genres ? movie.genres.map(g => g.name).join(", ") : "—";

    container.innerHTML = `
    <div id="movie-detail">
        <img src="${movie.image}" alt="${movie.title}" class="poster">
        <div class="info">
            <h2>${movie.title}</h2>
            <div class="details">
                <p>${movie.description || "Sin descripción disponible."}</p>
                <ul class="meta">
                    <li><strong>Género:</strong> ${genres}</li>
                    <li><strong>Año:</strong> ${year}</li>
                </ul>
            </div>
        </div>
    </div>
    `;
}


export function updateSectionTitle(text) {
    const titleEl = document.querySelector(".section-title");
    if (titleEl) {
        titleEl.textContent = text;
    }
}

/* ============================
   TABLA DE PELÍCULAS SIMILARES
   ============================ */

export function renderSimilarMoviesTable(movies, { title = "" } = {}) {
    const container = document.getElementById("similar-movies");
    if (!container) return;

    // Filtrar con imagen y limitar a 10
    const moviesWithImage = (movies || []).filter(m => m.image && m.image.trim() !== "");
    const limitedMovies = moviesWithImage.slice(0, 10);

    if (!limitedMovies.length) {
        container.innerHTML = `
            <div class="similar-card">
                <h3>${title}</h3>
                <p>No hay resultados disponibles.</p>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="similar-card">
            <h3>${title}</h3>
            <table id="similar-table" class="comparative-table">
                <thead>
                    <tr>
                        <th data-sort="title">
                            Título 
                            <span class="sort-icon asc">▲</span>
                            <span class="sort-icon desc">▼</span>
                        </th>
                        <th data-sort="year">
                            Fecha 
                            <span class="sort-icon asc">▲</span>
                            <span class="sort-icon desc">▼</span>
                        </th>
                        <th data-sort="rating">
                            Valoración 
                            <span class="sort-icon asc">▲</span>
                            <span class="sort-icon desc">▼</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                ${limitedMovies.map(m => {
                    const year = m.releaseDate ? m.releaseDate.split("-")[0] : "-";
                    return `
                        <tr class="clickable-row" data-id="${m.id}" data-poster="${m.image}">
                            <td>${m.title}</td>
                            <td>${year}</td>
                            <td>${typeof m.rating === "number" ? m.rating.toFixed(1) : "-"}</td>
                        </tr>
                    `;
                }).join("")}
                </tbody>
            </table>
        </div>
    `;

    const table = document.getElementById("similar-table");
    const tbody = table.querySelector("tbody");

    // Click a detalle
    tbody.addEventListener("click", (e) => {
        const row = e.target.closest(".clickable-row");
        if (!row) return;
        const id = row.dataset.id;
        if (id) window.location.href = `movie.html?id=${id}`;
    });

    // Hover poster
    let preview = document.getElementById("poster-preview");
    if (!preview) {
        preview = document.createElement("div");
        preview.id = "poster-preview";
        preview.style.position = "absolute";
        preview.style.display = "none";
        preview.style.zIndex = "1000";
        preview.style.border = "1px solid #ccc";
        preview.style.background = "#000";
        preview.style.padding = "4px";
        preview.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        document.body.appendChild(preview);
    }
    tbody.addEventListener("mouseenter", (e) => {
        const row = e.target.closest(".clickable-row");
        if (!row) return;
        const img = row.dataset.poster;
        if (!img) { preview.style.display = "none"; return; }
        preview.innerHTML = `<img src="${img}" style="width:120px;">`;
        preview.style.display = "block";
    }, true);
    tbody.addEventListener("mousemove", (e) => {
        preview.style.top = `${e.pageY + 10}px`;
        preview.style.left = `${e.pageX + 10}px`;
    });
    tbody.addEventListener("mouseleave", () => { preview.style.display = "none"; }, true);

    // Ordenación por iconos ▲ ▼
    enableSimilarMoviesSorting(table, limitedMovies);
}


function enableSimilarMoviesSorting(table, movies) {
    const headers = table.querySelectorAll("th");

    headers.forEach(header => {
        const ascIcon = header.querySelector(".sort-icon.asc");
        const descIcon = header.querySelector(".sort-icon.desc");
        const key = header.dataset.sort;

        ascIcon.addEventListener("click", () => {
            sortTable(movies, key, true);
            setActiveIcon(ascIcon, descIcon);
        });

        descIcon.addEventListener("click", () => {
            sortTable(movies, key, false);
            setActiveIcon(descIcon, ascIcon);
        });
    });

    function setActiveIcon(active, inactive) {
        // reset todos
        table.querySelectorAll(".sort-icon").forEach(icon => icon.classList.remove("active"));
        // activar solo el clicado
        active.classList.add("active");
        inactive.classList.remove("active");
    }

    function sortTable(movies, key, ascending) {
        const sorted = [...movies].sort((a, b) => {
            if (a[key] < b[key]) return ascending ? -1 : 1;
            if (a[key] > b[key]) return ascending ? 1 : -1;
            return 0;
        });

        const tbody = table.querySelector("tbody");
        tbody.innerHTML = sorted.map(m => `
            <tr class="clickable-row" data-id="${m.id}" data-poster="${m.image}">
                <td>${m.title}</td>
                <td>${m.year}</td>
                <td>${typeof m.rating === "number" ? m.rating.toFixed(1) : "-"}</td>
            </tr>
        `).join("");
    }
}


export function hideKPIs() {
    const kpi = document.getElementById("kpi-container");
    if (kpi) kpi.style.display = "none";
}

export function showKPIs() {
    const kpi = document.getElementById("kpi-container");
    if (kpi) kpi.style.display = "flex"; 
}
