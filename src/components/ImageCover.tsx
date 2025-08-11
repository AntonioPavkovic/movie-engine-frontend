import { useState } from "react";

interface CoverImageProps {
  movieId: number;
  title: string;
  className?: string;
  [key: string]: any;
}

const CoverImage = ({ movieId, title, className = '', ...props }: CoverImageProps) => {
  const [imgSrc, setImgSrc] = useState(`/movie_covers/${movieId}.jpg`);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (imgSrc.endsWith('.jpg')) {
      setImgSrc(`/movie_covers/${movieId}.jpeg`);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded text-gray-600 ${className}`} {...props}>
        <div className="text-center p-4">
          <span className="block text-2xl mb-2">📽️</span>
          <span className="text-sm">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={title}
      className={`w-full h-full object-cover ${className}`}
      style={{ width: '100%', height: '100%' }}
      onError={handleImageError}
      loading="lazy"
      {...props}
    />
  );
};

export default CoverImage;