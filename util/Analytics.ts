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
  private static sessionStartTime: number = Date.now();
  private static lastActivityTime: number = Date.now();

  /**
   * Track when a user views a POI (opens the bottom sheet)
   */
  static async trackPOIView(poiId: number, poiTitle: string): Promise<void> {
    try {
      Analytics.updateActivity();
      await addDoc(collection(db, 'poi_views'), {
        type: 'poi_view',
        poiId,
        poiTitle,
        sessionId: Analytics.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'web',
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
      Analytics.updateActivity();
      await addDoc(collection(db, 'poi_clicks'), {
        type: 'poi_click',
        poiId,
        poiTitle,
        sessionId: Analytics.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'web',
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
      Analytics.updateActivity();
      await addDoc(collection(db, 'map_views'), {
        type: 'map_view',
        sessionId: Analytics.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'web',
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
      Analytics.updateActivity();
      await addDoc(collection(db, 'website_views'), {
        type: 'page_view',
        sessionId: Analytics.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'web',
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
      Analytics.updateActivity();
      await addDoc(collection(db, 'poi_interactions'), {
        type: 'poi_interaction',
        poiId,
        poiTitle,
        sessionId: Analytics.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'web',
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
    return Analytics.sessionId;
  }

  /**
   * Generate a new session ID (useful for new app launches)
   */
  static renewSession(): string {
    Analytics.sessionId = Math.random().toString(36).substring(2, 15);
    Analytics.sessionStartTime = Date.now();
    Analytics.lastActivityTime = Date.now();
    return Analytics.sessionId;
  }

  /**
   * Update the last activity time (call this on user interactions)
   */
  static updateActivity = (): void => {
    Analytics.lastActivityTime = Date.now();
  }

  /**
   * Get current session duration in minutes
   */
  static getSessionDuration(): number {
    return Math.floor((Analytics.lastActivityTime - Analytics.sessionStartTime) / (1000 * 60));
  }

  /**
   * Track session duration when user leaves or app closes
   */
  static async trackSessionDuration(): Promise<void> {
    try {
      const durationMinutes = Analytics.getSessionDuration();
      
      await addDoc(collection(db, 'session_durations'), {
        type: 'session_duration',
        sessionId: Analytics.sessionId,
        durationMinutes,
        startTime: new Date(Analytics.sessionStartTime),
        endTime: new Date(Analytics.lastActivityTime),
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'web'
        }
      });
    } catch (error) {
      console.error('Failed to track session duration:', error);
    }
  }

  /**
   * Get session duration category for analytics
   */
  static getSessionDurationCategory(): string {
    const duration = Analytics.getSessionDuration();
    if (duration < 10) return 'short'; // Under 10 minutes
    if (duration < 20) return 'medium'; // 10-20 minutes
    return 'long'; // 20+ minutes
  }
}