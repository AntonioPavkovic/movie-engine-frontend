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

  const handleRate = async (rating: number) => {
    setIsRating(true);
    try {
      await onRate(item.id, rating);
    } catch (error) {
      console.error('Failed to rate:', error);
    } finally {
      setIsRating(false);
    }
  };

  return (
    <article className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-4 flex flex-col">
      <div className="w-full h-48 overflow-hidden rounded-lg">
        <CoverImage 
          movieId={item.id}
          title={item.title}
        />
      </div>

      <div className="mt-3 flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-500">
        <div className="flex justify-between items-center">
          <span>Released: {new Date(item.releaseDate).getFullYear()}</span>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            <span className="font-medium text-gray-700">
              {item.avgRating.toFixed(1)}
            </span>
            <span className="text-xs">({item.ratingsCount})</span>
          </div>
        </div>
        
        <div className="text-xs">
          <span className="font-medium">Cast:</span> {item.casts.map(c => c.actor.name).slice(0,3).join(", ")}
          {item.casts.length > 3 && <span className="text-gray-400"> +{item.casts.length - 3} more</span>}
        </div>
      </div>


      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500 mb-2">Rate this {item.type.toLowerCase()}:</div>
        <div 
          className="flex gap-1"
          onMouseLeave={() => setHoveredRating(0)}
        >
          {[1,2,3,4,5].map(rating => (
            <button
              key={rating}
              onClick={() => handleRate(rating)}
              onMouseEnter={() => setHoveredRating(rating)}
              disabled={isRating}
              className={`
                px-2 py-1 rounded border text-sm transition-all duration-150
                ${isRating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-50 hover:border-yellow-300'}
                ${hoveredRating >= rating ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'hover:bg-gray-50'}
              `}
              aria-label={`Rate ${rating} star${rating !== 1 ? 's' : ''}`}
            >
              {hoveredRating >= rating ? '★' : '☆'}
              <span className="ml-1">{rating}</span>
            </button>
          ))}
        </div>
        {isRating && (
          <div className="text-xs text-gray-500 mt-1">Submitting rating...</div>
        )}
      </div>
    </article>
  );
}