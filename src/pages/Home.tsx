import { useEffect, useState, useCallback } from "react";

import MediaCard from "../components/MediaCard";
import { searchMovies, fetchTop, rateMovie } from "../api/api";
import { useDebounce } from "../hooks/useDebounde";
import type { MediaType, MediaItem } from "../types/types";

const LIMIT = 10;

export default function Home() {
  const [type, setType] = useState<MediaType>("MOVIE");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (reset = false) => {
    try {
      setError(null);
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      const data: MediaItem[] =
        debouncedQuery.length >= 2
          ? await searchMovies(debouncedQuery, type, LIMIT, currentOffset)
          : await fetchTop(type, LIMIT, currentOffset);

      if (reset) {
        setItems(data);
        setOffset(LIMIT);
      } else {
        setItems(prev => [...prev, ...data]);
        setOffset(prev => prev + LIMIT);
      }
      
      setHasMore(data.length === LIMIT);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [offset, debouncedQuery, type]);

  useEffect(() => {
    setOffset(0);
    setItems([]);
    load(true);
  }, [type, debouncedQuery]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    load(false);
  };

  const handleRate = async (id: number, rating: number) => {
    try {
      setItems(prev => prev.map(it => 
        it.id === id 
          ? { 
              ...it, 
              ratingsCount: it.ratingsCount + 1, 
              avgRating: ((it.avgRating * it.ratingsCount) + rating) / (it.ratingsCount + 1) 
            } 
          : it
      ));
      await rateMovie(id, rating);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Top Rated</h1>
      </header>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search (≥2 chars). Try '5 stars' or 'after 2015'"
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => {
            console.log('Switching to MOVIE');
            setType("MOVIE");
          }} 
          className={`px-3 py-1 rounded ${type === "MOVIE" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
        >
          Movies
        </button>
        <button 
          onClick={() => {
            console.log('Switching to TV_SHOW');
            setType("TV_SHOW");
          }} 
          className={`px-3 py-1 rounded ${type === "TV_SHOW" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
        >
          TV Shows
        </button>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
        {items.map(item => <MediaCard key={item.id} item={item} onRate={handleRate} />)}
      </section>

      <div className="mt-6 text-center">
        {loading ? (
          <button className="px-4 py-2 rounded border" disabled>Loading...</button>
        ) : hasMore ? (
          <button onClick={loadMore} className="px-4 py-2 rounded bg-gray-800 text-white">
            Load more
          </button>
        ) : (
          <div className="text-sm text-gray-500">No more results</div>
        )}
      </div>
    </main>
  );
}