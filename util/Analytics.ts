import { initializeApp } from 'firebase/app';
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../services/firebase.config';
import type { AnalyticsEvent } from '../types/database';

// Initialize Firebase for analytics (reuse existing config)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export class Analytics {
  private static sessionId: string = Math.random().toString(36).substring(2, 15);
  private static sessionStartTime: number = Date.now();
  private static lastActivityTime: number = Date.now();


////////////////////////////////////////////////
// Track when a user clicks/taps on a POI marker
////////////////////////////////////////////////
  static async trackPOIClick(poiId: number, poiTitle: string): Promise<void> {
    try {
      Analytics.updateActivity();
      const event: AnalyticsEvent = {
        type: 'poi_click',
        poiId,
        poiTitle,
        sessionId: Analytics.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'web',
          action: 'marker_clicked'
        }
      };
      await addDoc(collection(db, 'poi_clicks'), event);
    } catch (error) {
      console.error('Failed to track POI click:', error);
    }
  }


////////////////////////////////////////////////
// Track general page views for the website
////////////////////////////////////////////////
  static async trackPageView(pageName: string): Promise<void> {
    try {
      Analytics.updateActivity();
      const event: AnalyticsEvent = {
        type: 'page_view',
        sessionId: Analytics.sessionId,
        timestamp: serverTimestamp(),
        metadata: {
          platform: 'web',
          page: pageName
        }
      };
      await addDoc(collection(db, 'website_views'), event);
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }


////////////////////////////////////////////////
// Get current session ID
////////////////////////////////////////////////
  static getSessionId(): string {
    return Analytics.sessionId;
  }

  
////////////////////////////////////////////////
// Generate a new session ID (useful for new app launches)
////////////////////////////////////////////////
  static renewSession(): string {
    Analytics.sessionId = Math.random().toString(36).substring(2, 15);
    Analytics.sessionStartTime = Date.now();
    Analytics.lastActivityTime = Date.now();
    return Analytics.sessionId;
  }

  
////////////////////////////////////////////////
// Update the last activity time (call this on user interactions)
////////////////////////////////////////////////
  static updateActivity = (): void => {
    Analytics.lastActivityTime = Date.now();
  }

  
////////////////////////////////////////////////
// Get current session duration in minutes
////////////////////////////////////////////////
  static getSessionDuration(): number {
    return Math.floor((Analytics.lastActivityTime - Analytics.sessionStartTime) / (1000 * 60));
  }

  
////////////////////////////////////////////////
// Track session duration when user leaves or app closes
////////////////////////////////////////////////
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

  
////////////////////////////////////////////////
// Get session duration category for analytics
////////////////////////////////////////////////
  static getSessionDurationCategory(): string {
    const duration = Analytics.getSessionDuration();
    if (duration < 10) return 'short'; // Under 10 minutes
    if (duration < 20) return 'medium'; // 10-20 minutes
    return 'long'; // 20+ minutes
  }

  
////////////////////////////////////////////////
// Check if user has seen cookie consent in this session
////////////////////////////////////////////////
  static hasSeenCookieConsent(): boolean {
    const sessionId = Analytics.getSessionId();
    return sessionStorage.getItem(`cookieConsent_${sessionId}`) === 'true';
  }

  
////////////////////////////////////////////////
// Mark that user has seen cookie consent in this session
////////////////////////////////////////////////
  static markCookieConsentSeen(): void {
    const sessionId = Analytics.getSessionId();
    sessionStorage.setItem(`cookieConsent_${sessionId}`, 'true');
  }
}