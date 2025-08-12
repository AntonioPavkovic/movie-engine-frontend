import type { CastMember, MediaItem } from "../types/types";

const BASE = import.meta.env.VITE_API_BASE;
const API_KEY = import.meta.env.VITE_API_KEY as string;

if (!API_KEY) {
  console.warn("VITE_API_KEY not set. Requests may fail.");
}

const defaultHeaders = {
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
};

// Helper function for consistent error handling
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

export async function fetchTop(type: string, limit = 10, offset = 0) {
  const url = `${BASE}/movies/top?type=${encodeURIComponent(type)}&limit=${limit}`;

  console.log('Fetching top movies:', url);

  const res = await fetch(url, { headers: defaultHeaders });
  const data = await handleResponse(res);
  
  // Format the response data
  if (Array.isArray(data)) {
    return data.map(formatMovieToMediaItem);
  }
  
  return [];
}

// Update your searchMovies function to use the formatter
export async function searchMovies(query: string, type: string, limit = 10, offset = 0) {
  // Calculate page number from offset
  const page = Math.floor(offset / limit) + 1;
  
  // Build search query with type filter if specified
  let searchQuery = query;
  if (type === "MOVIE") {
    searchQuery = `${query} movies`.trim();
  } else if (type === "TV_SHOW") {
    searchQuery = `${query} series`.trim();
  }
  
  // Use the correct parameter name 'query' instead of 'q'
  const url = `${BASE}/movies/search?query=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`;
  
  console.log('Searching movies:', url);
  console.log('Original query:', query);
  console.log('Enhanced query:', searchQuery);

  const res = await fetch(url, { headers: defaultHeaders });
  const data = await handleResponse(res);
  
  // Format the response data
  if (data.success && data.data && Array.isArray(data.data.movies)) {
    return data.data.movies.map(formatMovieToMediaItem);
  }
  
  return [];
}

export async function searchMoviesWithMinLength(query: string, type: string, limit = 10, offset = 0): Promise<MediaItem[]> {
  if (query.length < 2) {
    return fetchTop(type, limit, offset);
  }
  
  return searchMovies(query, type, limit, offset);
}

// Advanced search that returns full metadata (total count, filters, suggestions)
export async function advancedSearch(query: string, limit = 10, offset = 0) {
  const page = Math.floor(offset / limit) + 1;
  const url = `${BASE}/movies/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
  
  console.log('Advanced search:', url);

  const res = await fetch(url, { headers: defaultHeaders });
  const data = await handleResponse(res);
  
  if (data.success && data.data) {
    return {
      items: data.data.movies || [],
      total: data.data.total || 0,
      totalPages: data.data.totalPages || 0,
      filters: data.data.filters || {},
      suggestions: data.data.suggestions || [],
      page: data.data.page || 1
    };
  }
  
  return {
    items: [],
    total: 0,
    totalPages: 0,
    filters: {},
    suggestions: [],
    page: 1
  };
}

// Rate movie function (unchanged)
export async function rateMovie(id: number, rating: number) {
  const url = `${BASE}/movies/${id}/rate`;
  
  console.log('Rating movie:', id, 'with', rating, 'stars');
  
  const res = await fetch(url, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({ stars: rating }),
  });
  
  return handleResponse(res);
}

// Debug functions for testing (optional - can be removed in production)
export async function debugDatabaseMovies() {
  const url = `${BASE}/movies/debug/database-movies`;
  const res = await fetch(url, { headers: defaultHeaders });
  return handleResponse(res);
}

export async function checkIndexExists() {
  const url = `${BASE}/movies/index-exists`;
  const res = await fetch(url, { headers: defaultHeaders });
  return handleResponse(res);
}

export async function syncMovies() {
  const url = `${BASE}/movies/sync-search`;
  const res = await fetch(url, { 
    method: "POST",
    headers: defaultHeaders 
  });
  return handleResponse(res);
}

// Test search with wildcard (useful for debugging)
export async function testSearch() {
  const url = `${BASE}/movies/search?query=*&limit=5`;
  const res = await fetch(url, { headers: defaultHeaders });
  return handleResponse(res);
}

const formatMovieToMediaItem = (movie: any): MediaItem => {
  // Convert cast string to CastMember array for compatibility
  let castsArray: CastMember[] = [];
  
  if (movie.cast && typeof movie.cast === 'string') {
    castsArray = movie.cast.split(', ')
      .filter((name: string) => name.trim())
      .map((name: string, index: number) => ({
        id: index + 1, // Generate fake ID
        role: 'Actor', // Default role
        actor: {
          id: index + 1, // Generate fake actor ID
          name: name.trim()
        }
      }));
  } else if (Array.isArray(movie.cast)) {
    castsArray = movie.cast.map((castMember: any, index: number) => ({
      id: index + 1,
      role: castMember.role || 'Actor',
      actor: {
        id: index + 1,
        name: castMember.actorName || castMember.name || 'Unknown Actor'
      }
    }));
  }

  return {
    id: movie.id,
    title: movie.title || 'Unknown Title',
    description: movie.description || 'No description available',
    coverUrl: movie.coverUrl || null,
    releaseDate: movie.releaseDate || '',
    type: movie.type || 'MOVIE',
    avgRating: typeof movie.avgRating === 'number' ? movie.avgRating : 0,
    ratingsCount: typeof movie.ratingsCount === 'number' ? movie.ratingsCount : 0,
    casts: castsArray,
    cast: movie.cast, // Keep original cast data for fallback
    score: movie.score,
    highlights: movie.highlights
  };
};
