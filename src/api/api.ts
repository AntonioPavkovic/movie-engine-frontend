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

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

export async function fetchTop(type: string, limit = 10, offset = 0): Promise<{
  items: MediaItem[];
  total: number;
  hasMore: boolean;
}> {
  const page = Math.floor(offset / limit);
  
  const url = `${BASE}/movies/top?type=${encodeURIComponent(type)}&limit=${limit}&page=${page}`;
  console.log('Fetching top movies:', url);
  console.log('Offset:', offset, '→ Page:', page);
  
  try {
    const res = await fetch(url, { headers: defaultHeaders });
    const data = await handleResponse(res);

    console.log('fetchTop response:', data);

    if (data.success && data.data) {
      const items = Array.isArray(data.data.movies) 
        ? data.data.movies.map(formatMovieToMediaItem) 
        : [];
        
      return {
        items,
        total: data.data.total || 0,
        hasMore: data.data.hasMore || false,
      };
    }
    if (Array.isArray(data)) {
      const items = data.map(formatMovieToMediaItem);
      return {
        items,
        total: items.length,
        hasMore: items.length === limit,
      };
    }
    
    console.warn('Unexpected fetchTop response format:', data);
    return {
      items: [],
      total: 0,
      hasMore: false,
    };
    
  } catch (error) {
    console.error('fetchTop error:', error);
    return {
      items: [],
      total: 0,
      hasMore: false,
    };
  }
}

export async function searchMovies(query: string, type: string, limit = 10, offset = 0): Promise<{
  items: MediaItem[];
  total: number;
  hasMore: boolean;
  filters?: any;
  suggestions?: string[];
}> {
  const page = Math.floor(offset / limit) + 1;
  

  const url = `${BASE}/movies/search?query=${encodeURIComponent(query)}&type=${type}&page=${page}&limit=${limit}`;

  const res = await fetch(url, { headers: defaultHeaders });
  const data = await handleResponse(res);
  
  if (data.success && data.data) {
    const items = Array.isArray(data.data.movies) 
      ? data.data.movies.map(formatMovieToMediaItem) 
      : [];
      
    return {
      items,
      total: data.data.total || 0,
      hasMore: (data.data.page || 1) < (data.data.totalPages || 0),
      filters: data.data.filters || {},
      suggestions: data.data.suggestions || [],
    };
  }
  
  return {
    items: [],
    total: 0,
    hasMore: false,
    filters: {},
    suggestions: [],
  };
}

export async function searchMoviesWithMinLength(
  query: string, 
  type: string, 
  limit = 10, 
  offset = 0
): Promise<{
  items: MediaItem[];
  total: number;
  hasMore: boolean;
  filters?: any;
  suggestions?: string[];
}> {
  if (query.length < 2) {
    const topResult = await fetchTop(type, limit, offset);
    return {
      items: topResult.items,
      total: topResult.total,
      hasMore: topResult.hasMore,
      filters: {},
      suggestions: [],
    };
  }
  
  return searchMovies(query, type, limit, offset);
}


export async function advancedSearch(query: string, limit = 10, offset = 0): Promise<{
  items: MediaItem[];
  total: number;
  totalPages: number;
  filters: any;
  suggestions: string[];
  page: number;
  hasMore: boolean;
}> {
  const page = Math.floor(offset / limit) + 1;
  const url = `${BASE}/movies/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
  
  console.log('Advanced search:', url);
  console.log('Page:', page, 'Offset:', offset);

  const res = await fetch(url, { headers: defaultHeaders });
  const data = await handleResponse(res);
  
  if (data.success && data.data) {
    const items = Array.isArray(data.data.movies) 
      ? data.data.movies.map(formatMovieToMediaItem) 
      : [];
      
    return {
      items,
      total: data.data.total || 0,
      totalPages: data.data.totalPages || 0,
      filters: data.data.filters || {},
      suggestions: data.data.suggestions || [],
      page: data.data.page || 1,
      hasMore: (data.data.page || 1) < (data.data.totalPages || 0),
    };
  }
  
  return {
    items: [],
    total: 0,
    totalPages: 0,
    filters: {},
    suggestions: [],
    page: 1,
    hasMore: false,
  };
}

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

const formatMovieToMediaItem = (movie: any): MediaItem => {
  let castsArray: CastMember[] = [];
  if (movie.cast && typeof movie.cast === 'string') {
    castsArray = movie.cast.split(', ')
      .filter((name: string) => name.trim())
      .map((name: string, index: number) => ({
        id: index + 1,
        role: 'Actor',
        actor: {
          id: index + 1,
          name: name.trim()
        }
      }));
  } 

  else if (movie.casts && Array.isArray(movie.casts)) {
    castsArray = movie.casts.map((castMember: any, index: number) => ({
      id: castMember.id || index + 1,
      role: castMember.role || 'Actor',
      actor: {
        id: castMember.actor?.id || index + 1,
        name: castMember.actor?.name || 'Unknown Actor'
      }
    }));
  }

  else if (Array.isArray(movie.cast)) {
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
    cast: movie.cast,
    score: movie.score,
    highlights: movie.highlights
  };
};