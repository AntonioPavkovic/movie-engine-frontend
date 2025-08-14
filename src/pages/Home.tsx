import { useEffect, useState, useCallback, useRef } from "react";
import MediaCard from "../components/MediaCard";
import { fetchTop, rateMovie, searchMoviesWithMinLength } from "../api/api";
import { useDebounce } from "../hooks/useDebounde";
import type { MediaType, MediaItem } from "../types/types";

const LIMIT = 10;

export default function Home() {
  const [type, setType] = useState<MediaType>("MOVIE");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const offsetRef = useRef(0);

  const getSearchHints = () => {
    if (debouncedQuery.length < 2) return null;
    const hints = [];
    if (debouncedQuery.match(/\d+\s*stars?/)) hints.push("Rating filter detected");
    if (debouncedQuery.match(/(?:after|since|before)\s+\d{4}/)) hints.push("Year filter detected");
    if (debouncedQuery.match(/older\s+than|newer\s+than/)) hints.push("Age filter detected");
    if (debouncedQuery.match(/(?:less\s+than|more\s+than|at\s+least)/)) hints.push("Smart rating filter detected");
    return hints.length > 0 ? hints : null;
  };

  const load = useCallback(async (reset = false) => {
    
    setLoading(currentLoading => {
      if (currentLoading) {
        return currentLoading; 
      }
      return true; 
    });

    try {
      setError(null);
      
      const currentOffset = reset ? 0 : offsetRef.current;

      let result: { items: MediaItem[]; total: number; hasMore: boolean; filters?: any; suggestions?: string[] };

      if (debouncedQuery.length >= 2) {
        result = await searchMoviesWithMinLength(debouncedQuery, type, LIMIT, currentOffset);
      } else if (debouncedQuery.length === 0) {
        result = await fetchTop(type, LIMIT, currentOffset);
      } else {
        result = { items: [], total: 0, hasMore: false, filters: {}, suggestions: [] };
      }


      if (reset) {
        setItems(result.items);
        setTotalResults(result.total || 0);
        setSuggestions(result.suggestions || []);
        setAppliedFilters(result.filters || {});
        setHasMore(result.hasMore && result.items.length > 0);
        offsetRef.current = result.items.length;
      } else {
        setItems(prev => [...prev, ...result.items]);
        offsetRef.current += result.items.length;
        setHasMore(result.hasMore && result.items.length > 0);
      }

    } catch (e: any) {
      setError(e.message || "Failed to load");
      if (reset) setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, type]);

  useEffect(() => {
    console.log('🔄 useEffect triggered:', {
      type,
      debouncedQuery,
      debouncedQueryLength: debouncedQuery.length
    });


    offsetRef.current = 0;
    setItems([]);
    setHasMore(true);
    
    load(true);
  }, [type, debouncedQuery]); 

  const loadMore = useCallback(() => {
    load(false);
  }, [load]);

  const handleRate = async (id: number, rating: number) => {
    try {
      setRatingSubmitting(true);
      setItems(prev =>
        prev.map(item =>
          item.id === id
            ? {
                ...item,
                ratingsCount: item.ratingsCount + 1,
                avgRating: ((item.avgRating * item.ratingsCount) + rating) / (item.ratingsCount + 1),
              }
            : item
        )
      );
      await rateMovie(id, rating);
    } catch (e: any) {
      console.error("Rating error:", e);
      setError(`Failed to rate: ${e.message}`);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleSuggestionClick = (s: string) => setQuery(s);

  const getResultsText = () => {
    if (debouncedQuery.length >= 2) return `Found ${totalResults} results for "${debouncedQuery}"`;
    if (debouncedQuery.length === 0) return `Top Rated ${type === "MOVIE" ? "Movies" : "TV Shows"}`;
    return "Enter at least 2 characters to search";
  };

  const getAppliedFiltersText = () => {
    if (!appliedFilters || Object.keys(appliedFilters).length === 0) return null;
    const texts = [];
    if (appliedFilters.type) texts.push(`Type: ${appliedFilters.type.join(", ")}`);
    if (appliedFilters.minRating) texts.push(`Min Rating: ${appliedFilters.minRating}⭐`);
    if (appliedFilters.year) texts.push(`Year: ${appliedFilters.year.join(", ")}`);
    if (appliedFilters.minYear) texts.push(`After: ${appliedFilters.minYear}`);
    if (appliedFilters.maxYear) texts.push(`Before: ${appliedFilters.maxYear}`);
    if (appliedFilters.decade) texts.push(`Decade: ${appliedFilters.decade}`);
    return texts.length > 0 ? `Filters: ${texts.join(" • ")}` : null;
  };

  return (
    <main className="p-4 max-w-6xl mx-auto relative">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Movie Engine</h1>
      </header>

      <div className="mb-6">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Try: 'less than 4 stars', 'after 2015 batman', 'at least 3 stars comedy', 'older than 5 years'"
            className="w-full border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none shadow-lg font-medium"
            style={{
              height: '8px',
              width: '250px',
              fontSize: '20px',
              padding: '25px 35px',
              lineHeight: '1.3'
            }}
          />
        {getSearchHints() && (
          <div className="mt-3 flex flex-wrap gap-2">
            {getSearchHints()?.map((hint, i) => (
              <span key={i} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">{hint}</span>
            ))}
          </div>
        )}
        {query.length === 1 && <div className="mt-2 text-sm text-amber-600">Enter at least 2 characters to search</div>}
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setType("MOVIE");
          }}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${type==="MOVIE"?"bg-blue-600 text-white shadow-md transform scale-105":"bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"}`}>
          Movies
        </button>
        <button
          onClick={() => {
            setType("TV_SHOW");
          }}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${type==="TV_SHOW"?"bg-blue-600 text-white shadow-md transform scale-105":"bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"}`}>
          TV Shows
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700">{getResultsText()}</h2>
        {getAppliedFiltersText() && <div className="mt-1 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">{getAppliedFiltersText()}</div>}
      </div>

      {suggestions.length>0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">No results found. Did you mean:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s,i) => (
              <button key={i} onClick={() => handleSuggestionClick(s)} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200 transition-colors">{s}</button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={()=>setError(null)} className="ml-2 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {loading && items.length===0 && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item,i)=>(
          <MediaCard key={`${item.id}-${i}`} item={item} onRate={handleRate} />
        ))}
      </section>

      {!loading && items.length===0 && !error && debouncedQuery.length>=2 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No results found</h3>
          <p>Try a different search term or check the suggestions above</p>
        </div>
      )}

      <div className="mt-8 text-center">
        {loading && items.length>0 ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Loading more...</span>
          </div>
        ) : hasMore && items.length>0 ? (
          <button onClick={loadMore} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium" disabled={loading}>
            Load More!
          </button>
        ) : items.length>0 ? (
          <div className="text-gray-500">That's all the results!</div>
        ) : null}
      </div>

      {ratingSubmitting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium">Submitting rating...</p>
          </div>
        </div>
      )}
    </main>
  );
}