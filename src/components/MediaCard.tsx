import type { MediaItem } from "../types/types";
import CoverImage from "./ImageCover";
import { useState } from "react";

interface Props {
  item: MediaItem;
  onRate: (id: number, rating: number) => Promise<void>;
}

export default function MediaCard({ item, onRate }: Props) {
  const [isRating, setIsRating] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submittedRating, setSubmittedRating] = useState<number | null>(null);

  const handleRate = async (rating: number) => {
    setIsRating(true);
    setError(null);
    setSubmittedRating(rating); 
    
    try {
      await onRate(item.id, rating);
      setTimeout(() => {
        setSubmittedRating(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to rate:', error);
      setError('Failed to submit rating. Please try again.');
      setSubmittedRating(null);
  
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsRating(false);
    }
  };

  const getCastDisplay = () => {
    if (item.cast && typeof item.cast === 'string') {
      const castNames = item.cast.split(', ').filter((name: string) => name.trim());
      if (castNames.length === 0) return 'No cast information';
      
      const displayNames = castNames.slice(0, 3);
      const moreCount = castNames.length - 3;
      
      return (
        <>
          {displayNames.join(', ')}
          {moreCount > 0 && <span className="text-gray-400"> +{moreCount} more</span>}
        </>
      );
    }
    
    if (item.casts && Array.isArray(item.casts) && item.casts.length > 0) {
      const castNames = item.casts
        .map((c) => c.actor.name)
        .slice(0, 3);
      
      return (
        <>
          {castNames.join(', ')}
          {item.casts.length > 3 && <span className="text-gray-400"> +{item.casts.length - 3} more</span>}
        </>
      );
    }
    
    return 'No cast information';
  };

  const getFormattedYear = () => {
    if (!item.releaseDate) return 'Unknown';
    try {
      return new Date(item.releaseDate).getFullYear().toString();
    } catch {
      return 'Unknown';
    }
  };

  const getFormattedRating = () => {
    const rating = item.avgRating || 0;
    return typeof rating === 'number' ? rating.toFixed(1) : '0.0';
  };

  return (
    <article className={`bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-4 flex flex-col ${isRating ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="w-full h-28 overflow-hidden rounded-lg">
        <CoverImage 
          movieId={item.id}
          title={item.title || 'Unknown Title'}
        />
      </div>

      <div className="mt-3 flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {item.title || 'Unknown Title'}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-3">
          {item.description || 'No description available'}
        </p>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-500">
        <div className="flex justify-between items-center">
          <span>Released: {getFormattedYear()}</span>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            <span className="font-medium text-gray-700">
              {getFormattedRating()}
            </span>
            <span className="text-xs">({item.ratingsCount || 0})</span>
          </div>
        </div>
        
        <div className="text-xs">
          <span className="font-medium">Cast:</span> {getCastDisplay()}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500 mb-2">
          Rate this {(item.type || 'item').toLowerCase()}:
        </div>
        
        <div 
          className="flex gap-1 relative"
          onMouseLeave={() => setHoveredRating(0)}
        >
          {[1,2,3,4,5].map(rating => (
            <button
              key={rating}
              onClick={() => handleRate(rating)}
              onMouseEnter={() => setHoveredRating(rating)}
              disabled={isRating}
              className={`
                px-2 py-1 rounded border text-sm transition-all duration-150 relative
                ${isRating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-50 hover:border-yellow-300'}
                ${hoveredRating >= rating ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'hover:bg-gray-50'}
                ${submittedRating === rating ? 'bg-green-100 border-green-300 text-green-700' : ''}
              `}
              aria-label={`Rate ${rating} star${rating !== 1 ? 's' : ''}`}
            >
              {hoveredRating >= rating ? '★' : '☆'}
              <span className="ml-1">{rating}</span>
          
              {isRating && submittedRating === rating && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded">
                  <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                </div>
              )}
            </button>
          ))}
        </div>

 
        {isRating && (
          <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
            <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
            Submitting {submittedRating}-star rating...
          </div>
        )}
        
        {submittedRating && !isRating && !error && (
          <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
            Rating submitted successfully!
          </div>
        )}
      </div>
    </article>
  );
}