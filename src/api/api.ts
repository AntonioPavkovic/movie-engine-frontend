const BASE = import.meta.env.VITE_API_BASE;
const API_KEY = import.meta.env.VITE_API_KEY as string;

if (!API_KEY) {
  console.warn("VITE_API_KEY not set. Requests may fail.");
}

const defaultHeaders = {
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
};

export async function fetchTop(type: string, limit = 10, offset = 0) {
  const url = `${BASE}/movies/top?type=${encodeURIComponent(type)}&limit=${limit}&offset=${offset}`;

  console.log('Fetching:', url);
  console.log('Headers:', defaultHeaders);

  const res = await fetch(url, { headers: defaultHeaders });
  if (!res.ok) throw new Error(`fetchTop failed: ${res.status}`);
  return res.json();
}

export async function searchMovies(q: string, type: string, limit = 10, offset = 0) {
  const url = `${BASE}/movies/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { headers: defaultHeaders });
  if (!res.ok) throw new Error(`searchMovies failed: ${res.status}`);
  return res.json();
}

export async function rateMovie(id: number, rating: number) {
  const url = `${BASE}/movies/${id}/rate`;
  const res = await fetch(url, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) throw new Error(`rateMovie failed: ${res.status}`);
  return res.json();
}
