import { useEffect } from 'react';
import { Analytics } from '../util/Analytics';

/**
 * Simple hook for session tracking on web
 * @param pageName - Name of the page/component for analytics
 */
export const useSessionTracking = (pageName?: string) => {
  useEffect(() => {
    // Track page view if pageName is provided
    if (pageName) {
      Analytics.trackPageView(pageName);
    }

    // Web-specific: Handle page close/visibility
    const handleBeforeUnload = () => Analytics.trackSessionDuration();
    const handleVisibilityChange = () => {
      if (document.hidden) {
        Analytics.trackSessionDuration();
      } else {
        Analytics.updateActivity();
      }
    };

    // Add web listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      Analytics.trackSessionDuration();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pageName]);

  // Return simple utility function
  return Analytics.updateActivity;
};
