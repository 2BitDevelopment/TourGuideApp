import { useCallback, useEffect, useState } from 'react';
import DatabaseApi, { POI } from '../services/DatabaseApi';
import { ImageLoadingState } from '../types/database';

interface UseImageLoadingReturn {
  imageStates: Map<string, ImageLoadingState>;
  loadImage: (imageID: string) => Promise<void>;
  loadImages: (imageIDs: string[]) => Promise<void>;
  preloadPOIImages: (pois: POI[]) => Promise<void>;
  clearCache: () => void;
  isLoading: boolean;
  hasErrors: boolean;
  getImageUrl: (imageID: string) => string | null;
  isImageLoading: (imageID: string) => boolean;
  getImageError: (imageID: string) => string | null;
}

////////////////////////////////////////////////
// For Image component caching, loading, and error handling
////////////////////////////////////////////////
export const useImageLoading = (): UseImageLoadingReturn => {
  const [imageStates, setImageStates] = useState<Map<string, ImageLoadingState>>(new Map());

  // Single image loading
  const loadImage = useCallback(async (imageID: string) => {
    if (!imageID || imageID.trim() === '') return;

    // Check if already loaded or loading
    const currentState = imageStates.get(imageID);
    if (currentState?.url || currentState?.loading) return;

    // Set loading state
    setImageStates(prev => new Map(prev.set(imageID, {
      loading: true,
      url: null,
      error: null
    })));

    try {
      const url = await DatabaseApi.loadImage(imageID);
      
      setImageStates(prev => new Map(prev.set(imageID, {
        loading: false,
        url: url,
        error: url ? null : 'Failed to load image'
      })));
    } catch (error) {
      console.error(`Failed to load image ${imageID}:`, error);
      setImageStates(prev => new Map(prev.set(imageID, {
        loading: false,
        url: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      })));
    }
  }, [imageStates]);

  // Multiple images loading
  const loadImages = useCallback(async (imageIDs: string[]) => {
    if (!imageIDs || imageIDs.length === 0) return;

    const validImageIDs = imageIDs.filter(id => id && id.trim());
    const uncachedImageIDs = validImageIDs.filter(id => {
      const state = imageStates.get(id);
      return !state?.url && !state?.loading;
    });

    if (uncachedImageIDs.length === 0) return;

    // Set loading states for all uncached images
    setImageStates(prev => {
      const newStates = new Map(prev);
      uncachedImageIDs.forEach(id => newStates.set(id, {
        loading: true,
        url: null,
        error: null
      }));
      return newStates;
    });

    try {
      const results = await DatabaseApi.loadImages(uncachedImageIDs);
      
      // Update image states
      setImageStates(prev => {
        const newStates = new Map(prev);
        results.forEach((url, imageID) => {
          newStates.set(imageID, {
            loading: false,
            url: url,
            error: url ? null : 'Failed to load image'
          });
        });
        return newStates;
      });

    } catch (error) {
      console.error('Failed to load images:', error);
      
      // Set error for all failed images
      setImageStates(prev => {
        const newStates = new Map(prev);
        uncachedImageIDs.forEach(imageID => {
          newStates.set(imageID, {
            loading: false,
            url: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        });
        return newStates;
      });
    }
  }, [imageStates]);

  // Preload POI images
  const preloadPOIImages = useCallback(async (pois: POI[]) => {
    if (!pois || pois.length === 0) return;

    const imageIDs = pois
      .map(poi => poi.imageID)
      .filter(imageID => imageID && imageID.trim() !== ''); // Filter out empty imageIDs

    await loadImages(imageIDs);
  }, [loadImages]);

  // Clear cache
  const clearCache = useCallback(() => {
    setImageStates(new Map());
    DatabaseApi.clearImageCache();
  }, []);

  // Helper functions
  const getImageUrl = useCallback((imageID: string): string | null => {
    return imageStates.get(imageID)?.url || null;
  }, [imageStates]);

  const isImageLoading = useCallback((imageID: string): boolean => {
    return imageStates.get(imageID)?.loading || false;
  }, [imageStates]);

  const getImageError = useCallback((imageID: string): string | null => {
    return imageStates.get(imageID)?.error || null;
  }, [imageStates]);

  // Computed states
  const isLoading = Array.from(imageStates.values()).some(state => state.loading);
  const hasErrors = Array.from(imageStates.values()).some(state => state.error !== null);

  return {
    imageStates,
    loadImage,
    loadImages,
    preloadPOIImages,
    clearCache,
    isLoading,
    hasErrors,
    getImageUrl,
    isImageLoading,
    getImageError
  };
};


////////////////////////////////////////////////
// Hook for loading a single image with loading state
////////////////////////////////////////////////
export const useSingleImage = (imageID: string | undefined) => {
  const { imageStates, loadImage } = useImageLoading();
  
  useEffect(() => {
    if (imageID) {
      loadImage(imageID);
    }
  }, [imageID, loadImage]);

  const state = imageID ? imageStates.get(imageID) : undefined;
  
  return {
    imageUrl: state?.url || null,
    isLoading: state?.loading || false,
    error: state?.error || null,
    retry: () => imageID && loadImage(imageID)
  };
};