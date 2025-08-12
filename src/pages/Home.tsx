import { useEffect, useState, useCallback } from "react";
import MediaCard from "../components/MediaCard";
import { fetchTop, rateMovie, advancedSearch } from "../api/api";
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
  const [totalResults, setTotalResults] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  const load = useCallback(async (reset = false) => {
    try {
      setError(null);
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      
      let data: MediaItem[] = [];
      let total = 0;
      let searchSuggestions: string[] = [];
      let filters = {};

      if (debouncedQuery.length >= 2) {

        const searchResult = await advancedSearch(debouncedQuery, LIMIT, currentOffset);
        data = searchResult.items;
        total = searchResult.total;
        searchSuggestions = searchResult.suggestions || [];
        filters = searchResult.filters;
      } else if (debouncedQuery.length === 0) {
        data = await fetchTop(type, LIMIT, currentOffset);
        total = data.length; 
      } else {

        data = [];
        total = 0;
      }

      if (reset) {
        setItems(data);
        setOffset(LIMIT);
        setTotalResults(total);
        setSuggestions(searchSuggestions);
        setAppliedFilters(filters);
      } else {
        setItems(prev => [...prev, ...data]);
        setOffset(prev => prev + LIMIT);
      }
      
      setHasMore(data.length === LIMIT && (reset ? total > LIMIT : currentOffset + LIMIT < total));
    } catch (e: any) {
      setError(e.message || "Failed to load");
      setSuggestions([]);
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

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  const getResultsText = () => {
    if (debouncedQuery.length >= 2) {
      return `Found ${totalResults} results for "${debouncedQuery}"`;
    } else if (debouncedQuery.length === 0) {
      return `Top Rated ${type === "MOVIE" ? "Movies" : "TV Shows"}`;
    } else {
      return "Enter at least 2 characters to search";
    }
  };

  const getAppliedFiltersText = () => {
    if (!appliedFilters || Object.keys(appliedFilters).length === 0) return null;
    
    const filterTexts = [];
    if (appliedFilters.type) {
      filterTexts.push(`Type: ${appliedFilters.type.join(", ")}`);
    }
    if (appliedFilters.minRating) {
      filterTexts.push(`Min Rating: ${appliedFilters.minRating}⭐`);
    }
    if (appliedFilters.year) {
      filterTexts.push(`Year: ${appliedFilters.year.join(", ")}`);
    }
    if (appliedFilters.minYear) {
      filterTexts.push(`After: ${appliedFilters.minYear}`);
    }
    if (appliedFilters.maxYear) {
      filterTexts.push(`Before: ${appliedFilters.maxYear}`);
    }
    if (appliedFilters.decade) {
      filterTexts.push(`Decade: ${appliedFilters.decade}`);
    }
    
    return filterTexts.length > 0 ? `Filters: ${filterTexts.join(" • ")}` : null;
  };

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800">🎬 Movie Database</h1>
      </header>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try: '5 stars', 'excellent action movies after 2015', 'comedy series', 'older than 10 years'"
          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setType("MOVIE")} 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            type === "MOVIE" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🎬 Movies
        </button>
        <button 
          onClick={() => setType("TV_SHOW")} 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            type === "TV_SHOW" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          📺 TV Shows
        </button>
      </div>

      {/* Results Info */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700">
          {getResultsText()}
        </h2>
        
        {/* Applied Filters */}
        {getAppliedFiltersText() && (
          <div className="mt-1 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
            {getAppliedFiltersText()}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            No results found. Did you mean:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Results Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <MediaCard key={item.id} item={item} onRate={handleRate} />
        ))}
      </section>

      {/* No Results Message */}
      {!loading && items.length === 0 && !error && debouncedQuery.length >= 2 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No results found</h3>
          <p>Try a different search term or check the suggestions above</p>
        </div>
      )}

      {/* Load More Button */}
      <div className="mt-8 text-center">
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Loading...</span>
          </div>
        ) : hasMore && items.length > 0 ? (
          <button 
            onClick={loadMore} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Load More Results
          </button>
        ) : items.length > 0 ? (
          <div className="text-gray-500">
            🎯 That's all the results!
          </div>
        ) : null}
      </div>
    </main>
  );
}