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
          id: doc.id,
          title: data.title || '',
          text: data.text || '',
          location: {
            latitude: data.location?.latitude || 0,
            longitude: data.location?.longitude || 0,
            name: data.location?.name || ''
          },
          description: data.description || '',
          imageID: data.imageID || ''
        };
        
        console.log('Created POI object:', poi);
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
          id: docSnap.id,
          title: data.title || '',
          text: data.text || '',
          location: {
            latitude: data.location?.latitude || 0,
            longitude: data.location?.longitude || 0,
            name: data.location?.name || ''
          },
          description: data.description || '',
          imageID: data.imageID || ''
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
      console.error('Error loading image:', error);
      return null;
    }
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