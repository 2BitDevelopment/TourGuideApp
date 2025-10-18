import { initializeApp } from 'firebase/app';
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../services/firebase.config';

// Initialize Firebase for analytics (reuse existing config)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface AnalyticsEvent {
  type: 'poi_view' | 'poi_click' | 'map_view' | 'page_view';
  poiId?: number;
  poiTitle?: string;
  sessionId?: string;
  timestamp?: any;
  metadata?: Record<string, any>;
}

export class Analytics {
  private static sessionId: string = Math.random().toString(36).substring(2, 15);

  /**
   * Track when a user views a POI (opens the bottom sheet)
   */
  static async trackPOIView(poiId: number, poiTitle: string): Promise<void> {
    try {
      await addDoc(collection(db, 'poi_views'), {
        type: 'poi_view',
        poiId,
        poiTitle,
        sessionId: this.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'mobile',
          action: 'sheet_opened'
        }
      });
    } catch (error) {
      console.error('Failed to track POI view:', error);
    }
  }

  /**
   * Track when a user clicks/taps on a POI marker
   */
  static async trackPOIClick(poiId: number, poiTitle: string): Promise<void> {
    try {
      await addDoc(collection(db, 'poi_clicks'), {
        type: 'poi_click',
        poiId,
        poiTitle,
        sessionId: this.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'mobile',
          action: 'marker_clicked'
        }
      });
    } catch (error) {
      console.error('Failed to track POI click:', error);
    }
  }

  /**
   * Track map page views
   */
  static async trackMapView(): Promise<void> {
    try {
      await addDoc(collection(db, 'map_views'), {
        type: 'map_view',
        sessionId: this.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'mobile',
          page: 'MapPage'
        }
      });
    } catch (error) {
      console.error('Failed to track map view:', error);
    }
  }

  /**
   * Track general page views for the website
   */
  static async trackPageView(pageName: string): Promise<void> {
    try {
      await addDoc(collection(db, 'website_views'), {
        type: 'page_view',
        sessionId: this.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'mobile',
          page: pageName
        }
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  /**
   * Track POI interactions (like "Learn More" button clicks)
   */
  static async trackPOIInteraction(poiId: number, poiTitle: string, action: string): Promise<void> {
    try {
      await addDoc(collection(db, 'poi_interactions'), {
        type: 'poi_interaction',
        poiId,
        poiTitle,
        sessionId: this.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'mobile',
          action
        }
      });
    } catch (error) {
      console.error('Failed to track POI interaction:', error);
    }
  }

  /**
   * Get current session ID
   */
  static getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Generate a new session ID (useful for new app launches)
   */
  static renewSession(): string {
    this.sessionId = Math.random().toString(36).substring(2, 15);
    return this.sessionId;
  }
}