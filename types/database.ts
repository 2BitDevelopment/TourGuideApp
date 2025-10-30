// Database API Types
export interface Location {
  latitude: number;  // 0-1 range for percentage positioning
  longitude: number; // 0-1 range for percentage positioning
  name?: string;
}

export interface POI {
  id: number;
  title: string;
  text: string;
  text2: string;
  location: Location;
  description: string;
  imageID: string;
}

// Image loading states
export interface ImageLoadingState {
  loading: boolean;
  url: string | null;
  error: string | null;
}

// Analytics event structure
export interface AnalyticsEvent {
  type: 'poi_click' | 'page_view';
  poiId?: number;
  poiTitle?: string;
  sessionId?: string;
  timestamp?: any;
  metadata?: Record<string, any>;
}