export function calculateTotalMovies(movies) {
    return movies.length;
}

export function calculateAverageScore(movies) {
    if (!movies.length) return 0;
    let suma = 0;
    movies.forEach(movie => suma += movie.rating);
    return suma / movies.length;
}

export function calculateMostPopular(movies) {
    if (!movies || !movies.length) return null;
    const sorted = [...movies].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted[0]?.title || null;
}
