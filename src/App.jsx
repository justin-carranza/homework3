import { useEffect, useMemo, useState } from 'react';

const API_KEY = "1f91ca3380fdc6b0c55096f8b99024d6";
const API_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

function MovieCard({ movie }) {
  return (
    <article className="movie-card">
      {movie.poster_path ? (
        <img
          className="movie-poster"
          src={`${IMAGE_URL}${movie.poster_path}`}
          alt={movie.title}
        />
      ) : (
        <div className="movie-poster poster-missing">{movie.title}</div>
      )}
      <h2>{movie.title}</h2>
      <p>Release Date: {movie.release_date || 'N/A'}</p>
      <p>Rating: {movie.vote_average ?? 'N/A'}</p>
    </article>
  );
}

export default function App() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY') {
      setError('Add your TMDB API key to the .env file.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const query = search.trim();
    const endpoint = query ? 'search/movie' : 'movie/popular';
    const url = new URL(`${API_URL}/${endpoint}`);
    url.searchParams.set('api_key', API_KEY);
    url.searchParams.set('language', 'en-US');
    url.searchParams.set('page', String(page));

    if (query) {
      url.searchParams.set('query', query);
      url.searchParams.set('include_adult', 'false');
    }

    async function loadMovies() {
      try {
        setError('');
        setLoading(true);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Could not load movies from TMDB. Check your API key.');
        }
        const data = await response.json();
        setMovies(data.results ?? []);
        setTotalPages(Math.max(1, data.total_pages ?? 1));
      } catch (err) {
        if (err.name !== 'AbortError') {
          setMovies([]);
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMovies();
    return () => controller.abort();
  }, [search, page]);

  const displayedMovies = useMemo(() => {
    const sorted = [...movies];

    switch (sortBy) {
      case 'release-asc':
        return sorted.sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
      case 'release-desc':
        return sorted.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
      case 'rating-asc':
        return sorted.sort((a, b) => a.vote_average - b.vote_average);
      case 'rating-desc':
        return sorted.sort((a, b) => b.vote_average - a.vote_average);
      default:
        return sorted;
    }
  }, [movies, sortBy]);

  function handleSearch(event) {
    setSearch(event.target.value);
    setPage(1);
  }

  return (
    <>
      <header className="page-header">
        <h1>Movie Explorer</h1>
        <div className="controls">
          <input
            type="search"
            placeholder="Search for a movie..."
            aria-label="Search for a movie"
            value={search}
            onChange={handleSearch}
          />
          <select
            aria-label="Sort movies"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="">Sort By</option>
            <option value="release-asc">Release Date (Asc)</option>
            <option value="release-desc">Release Date (Desc)</option>
            <option value="rating-asc">Rating (Asc)</option>
            <option value="rating-desc">Rating (Desc)</option>
          </select>
        </div>
      </header>

      <main>
        {error ? (
          <p className="message">{error}</p>
        ) : loading ? null : displayedMovies.length === 0 ? (
          <p className="message">No movies found.</p>
        ) : (
          <div className="movie-grid">
            {displayedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {!error && !loading && (
          <nav className="pagination" aria-label="Movie pages">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              aria-disabled={page === totalPages}
            >
              Next
            </button>
          </nav>
        )}
      </main>
    </>
  );
}
