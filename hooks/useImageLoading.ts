import { useCallback, useEffect, useState } from 'react';
import DatabaseApi, { POI } from '../services/DatabaseApi';

interface UseImageLoadingReturn {
  imageUrls: Map<string, string | null>;
  loadingStates: Map<string, boolean>;
  errors: Map<string, string | null>;
  loadImage: (imageID: string) => Promise<void>;
  loadImages: (imageIDs: string[]) => Promise<void>;
  preloadPOIImages: (pois: POI[]) => Promise<void>;
  clearCache: () => void;
  isLoading: boolean;
  hasErrors: boolean;
}

/**
 * Custom hook for managing POI image loading with caching and error handling
 */
export const useImageLoading = (): UseImageLoadingReturn => {
  const [imageUrls, setImageUrls] = useState<Map<string, string | null>>(new Map());
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [errors, setErrors] = useState<Map<string, string | null>>(new Map());

  // Single image loading
  const loadImage = useCallback(async (imageID: string) => {
    if (!imageID || imageID.trim() === '') return;

    // Check if already loaded or loading
    if (imageUrls.has(imageID) || loadingStates.get(imageID)) return;

    // Set loading state
    setLoadingStates(prev => new Map(prev.set(imageID, true)));
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(imageID);
      return newErrors;
    });

    try {
      const url = await DatabaseApi.loadImage(imageID);
      
      setImageUrls(prev => new Map(prev.set(imageID, url)));
      
      if (!url) {
        setErrors(prev => new Map(prev.set(imageID, 'Failed to load image')));
      }
    } catch (error) {
      console.error(`Failed to load image ${imageID}:`, error);
      setErrors(prev => new Map(prev.set(imageID, error instanceof Error ? error.message : 'Unknown error')));
    } finally {
      setLoadingStates(prev => {
        const newStates = new Map(prev);
        newStates.delete(imageID);
        return newStates;
      });
    }
  }, [imageUrls, loadingStates]);

  // Multiple images loading
  const loadImages = useCallback(async (imageIDs: string[]) => {
    if (!imageIDs || imageIDs.length === 0) return;

    const validImageIDs = imageIDs.filter(id => id && id.trim());
    const uncachedImageIDs = validImageIDs.filter(id => !imageUrls.has(id) && !loadingStates.get(id));

    if (uncachedImageIDs.length === 0) return;

    // Set loading states for all uncached images
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      uncachedImageIDs.forEach(id => newStates.set(id, true));
      return newStates;
    });

    // Clear previous errors for these images
    setErrors(prev => {
      const newErrors = new Map(prev);
      uncachedImageIDs.forEach(id => newErrors.delete(id));
      return newErrors;
    });

    try {
      const results = await DatabaseApi.loadImages(uncachedImageIDs);
      
      // Update image URLs
      setImageUrls(prev => {
        const newUrls = new Map(prev);
        results.forEach((url, imageID) => {
          newUrls.set(imageID, url);
          if (!url) {
            setErrors(prevErrors => new Map(prevErrors.set(imageID, 'Failed to load image')));
          }
        });
        return newUrls;
      });

    } catch (error) {
      console.error('Failed to load images:', error);
      
      // Set error for all failed images
      uncachedImageIDs.forEach(imageID => {
        setErrors(prev => new Map(prev.set(imageID, error instanceof Error ? error.message : 'Unknown error')));
      });
    } finally {
      // Clear loading states
      setLoadingStates(prev => {
        const newStates = new Map(prev);
        uncachedImageIDs.forEach(id => newStates.delete(id));
        return newStates;
      });
    }
  }, [imageUrls, loadingStates]);

  // Preload POI images
  const preloadPOIImages = useCallback(async (pois: POI[]) => {
    if (!pois || pois.length === 0) return;

    const imageIDs = pois
      .map(poi => poi.imageID)
      .filter(imageID => imageID && imageID.trim());

    await loadImages(imageIDs);
  }, [loadImages]);

  // Clear cache
  const clearCache = useCallback(() => {
    setImageUrls(new Map());
    setLoadingStates(new Map());
    setErrors(new Map());
    DatabaseApi.clearImageCache();
  }, []);

  // Computed states
  const isLoading = loadingStates.size > 0;
  const hasErrors = errors.size > 0;

  return {
    imageUrls,
    loadingStates,
    errors,
    loadImage,
    loadImages,
    preloadPOIImages,
    clearCache,
    isLoading,
    hasErrors
  };
};

/**
 * Hook for loading a single image with loading state
 */
export const useSingleImage = (imageID: string | undefined) => {
  const { imageUrls, loadingStates, errors, loadImage } = useImageLoading();
  
  useEffect(() => {
    if (imageID) {
      loadImage(imageID);
    }
  }, [imageID, loadImage]);

  const isLoading = imageID ? loadingStates.get(imageID) || false : false;
  const error = imageID ? errors.get(imageID) || null : null;
  const imageUrl = imageID ? imageUrls.get(imageID) || null : null;

  return {
    imageUrl,
    isLoading,
    error,
    retry: () => imageID && loadImage(imageID)
  };
};