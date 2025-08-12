export type MediaType = "MOVIE" | "TV_SHOW";

export interface CastMember {
  id: number;
  role: string;
  actor: { id: number; name: string };
}

export interface MediaItem {
  id: number;
  title: string;
  description: string;
  coverUrl: string | null;
  releaseDate: string;  
  type: MediaType;
  avgRating: number;
  ratingsCount: number;
  casts: CastMember[];
  
  cast?: string | any[];

  score?: number;
  highlights?: any;
}