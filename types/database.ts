// Database API Types
export interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface POI {
  id: string;
  title: string;
  text: string;
  text2: string;
  location: Location;
  description: string;
  imageID: string;
}


// Firebase Collections
export interface FirestorePOI {
  title: string;
  text: string;
  location: Location;
  description: string;
  imageID: string;
}

// API Response types
export type DatabaseApiResponse<T> = {
  data: T;
  error?: string;
};

// Image loading states
export interface ImageLoadingState {
  loading: boolean;
  url: string | null;
  error: string | null;
}