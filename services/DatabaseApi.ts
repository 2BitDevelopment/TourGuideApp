import { initializeApp } from 'firebase/app';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import { POI } from '../types/database';
import { COLLECTIONS, firebaseConfig, STORAGE_PATHS } from './firebase.config';

// Re-export types for convenience
export type { Location, POI } from '../types/database';

// Initialize Firebase
console.log('Initializing Firebase...');
console.log('Firebase config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  // Don't log sensitive keys, just check if they exist
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId
});

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Database API class
export class DatabaseApi {
  private static instance: DatabaseApi;
  private imageCache: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): DatabaseApi {
    if (!DatabaseApi.instance) {
      DatabaseApi.instance = new DatabaseApi();
    }
    return DatabaseApi.instance;
  }

  /**
   * Retrieves all poi items from Firestore (without images for performance)
   * @returns Promise<POI[]>
   */
  async getAllPOIs(): Promise<POI[]> {
    try {
      const POIItemsCollection = collection(db, COLLECTIONS.POI_ITEMS);
      const querySnapshot = await getDocs(POIItemsCollection);
      
      if (querySnapshot.empty) {
        console.warn('No documents found in collection');
        return [];
      }

      const POIs: POI[] = [];
      let docCount = 0;
      
      querySnapshot.forEach((doc) => {
        docCount++;
        
        const data = doc.data();
        
        const poi = {
          id: data.id || doc.id, // Use the id field from document, fallback to doc.id
          title: data.title || '',
          text: data.text || '',
          text2: data.text2 || '',
          location: {
            // latitude: data.location?.latitude || 0,    // Not used using hardcoded map coordinates
            // longitude: data.location?.longitude || 0,  // Not used, using hardcoded map coordinates
            name: data.location?.name || ''
          },
          description: data.description || '',
          imageID: `${data.id || doc.id}.jpg`
        };
        
        POIs.push(poi);
      });
      
      return POIs;
    } catch (error) {
      console.error('Error fetching POIs:', error);
      throw new Error('Failed to fetch POIs');
    }
  }

  /**
   * Retrieves a specific poi item by ID
   * @param itemId - The ID of the poi item
   * @returns Promise<POI | null>
   */
  async getPOIById(itemId: string): Promise<POI | null> {
    try {
      const docRef = doc(db, COLLECTIONS.POI_ITEMS, itemId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: data.id,
          title: data.title || '',
          text: data.text || '',
          text2: data.text2 || '',
          location: {
            // latitude: data.location?.latitude || 0,    // Not used, using hardcoded map coordinates
            // longitude: data.location?.longitude || 0,  // Not used ,using hardcoded map coordinates
            name: data.location?.name || ''
          },
          description: data.description || '',
          imageID: `${data.id || docSnap.id}.jpg` 
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching tour item:', error);
      throw new Error('Failed to fetch tour item');
    }
  }

  /**
   * Loads an image URL from Firebase Storage
   * @param imageID - The image ID/path in Firebase Storage
   * @returns Promise<string | null>
   */
  async loadImage(imageID: string): Promise<string | null> {
    if (!imageID) return null;
    
    // Check cache first
    if (this.imageCache.has(imageID)) {
      return this.imageCache.get(imageID)!;
    }

    try {
      const imageRef = ref(storage, `${STORAGE_PATHS.IMAGES}${imageID}`);
      const downloadURL = await getDownloadURL(imageRef);
      
      // Cache the URL for future use
      this.imageCache.set(imageID, downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error(`Error loading image ${imageID}:`, error);
      return null;
    }
  }

  /**
   * Loads multiple images in parallel from Firebase Storage
   * @param imageIDs - Array of image IDs/paths in Firebase Storage
   * @returns Promise<Map<string, string | null>>
   */
  async loadImages(imageIDs: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();
    
    if (!imageIDs || imageIDs.length === 0) {
      return results;
    }

    // Filter out empty imageIDs and get uncached ones
    const validImageIDs = imageIDs.filter(id => id && id.trim());
    const uncachedImageIDs = validImageIDs.filter(id => !this.imageCache.has(id));
    
    // Add cached results first
    validImageIDs.forEach(id => {
      if (this.imageCache.has(id)) {
        results.set(id, this.imageCache.get(id)!);
      }
    });

    if (uncachedImageIDs.length === 0) {
      return results;
    }

    // Load uncached images in parallel
    const loadPromises = uncachedImageIDs.map(async (imageID) => {
      try {
        const imageRef = ref(storage, `${STORAGE_PATHS.IMAGES}${imageID}`);
        const downloadURL = await getDownloadURL(imageRef);
        
        // Cache the successful result
        this.imageCache.set(imageID, downloadURL);
        return { imageID, url: downloadURL };
      } catch (error) {
        console.error(`Error loading image ${imageID}:`, error);
        return { imageID, url: null };
      }
    });

    const loadedResults = await Promise.all(loadPromises);
    
    // Add newly loaded results to the map
    loadedResults.forEach(({ imageID, url }) => {
      results.set(imageID, url);
    });

    return results;
  }

  /**
   * Preloads images for all POIs
   * @param pois - Array of POI objects
   * @returns Promise<Map<string, string | null>>
   */
  async preloadPOIImages(pois: POI[]): Promise<Map<string, string | null>> {
    const imageIDs = pois.map(poi => poi.imageID);
    
    return this.loadImages(imageIDs);
  }

  /**
   * Retrieves all POIs with their images preloaded
   * @returns Promise<POI[]> with images loaded in parallel
   */
  async getAllPOIsWithImages(): Promise<POI[]> {
    try {
      // Get POIs first
      const pois = await this.getAllPOIs();
      
      if (pois.length === 0) {
        return pois;
      }

      // Preload all images in parallel
      await this.preloadPOIImages(pois);

      return pois;
    } catch (error) {
      console.error('Error fetching POIs with images:', error);
      throw new Error('Failed to fetch POIs with images');
    }
  }

  /**
   * Gets the cached image URL for a POI
   * @param imageID - The image ID/path in Firebase Storage
   * @returns string | null - The cached URL or null if not cached
   */
  getCachedImageUrl(imageID: string): string | null {
    if (!imageID) return null;
    return this.imageCache.get(imageID) || null;
  }

  /**
   * Checks if an image is cached
   * @param imageID - The image ID/path in Firebase Storage
   * @returns boolean
   */
  isImageCached(imageID: string): boolean {
    return this.imageCache.has(imageID);
  }

  /**
   * Gets cache statistics
   * @returns object with cache information
   */
  getCacheStats() {
    return {
      size: this.imageCache.size,
      keys: Array.from(this.imageCache.keys()),
    };
  }

  /**
   * Clears the image cache
   */
  clearImageCache(): void {
    this.imageCache.clear();
  }

}

// Export singleton instance
export default DatabaseApi.getInstance();